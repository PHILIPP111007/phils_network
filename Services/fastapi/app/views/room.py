import os
from datetime import datetime

from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlmodel import delete, func, select
from sqlalchemy.orm import joinedload

from app.constants import DATETIME_FORMAT
from app.database import SessionDep
from app.models import (
	Message,
	MessageViewed,
	Room,
	RoomInvitation,
	RoomSubscribers,
	User,
)

router = APIRouter(tags=["room"])


class RoomNameAndSubscribers(BaseModel):
	name: str
	subscribers: list[int] = []


@router.get("/api/v2/room/")
async def get_room(session: SessionDep, request: Request):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	room_ids = await session.exec(
		select(RoomSubscribers.room_id).where(
			RoomSubscribers.user_id == request.state.user.id
		)
	)
	room_ids = room_ids.unique().all()

	rooms = await session.exec(select(Room).where(Room.id.in_(room_ids)))
	rooms = rooms.unique().all()

	time_and_rooms = []
	for room in rooms:
		message = await session.exec(
			select(Message)
			.where(Message.room_id == room.id)
			.order_by(Message.timestamp.desc())
			.options(joinedload(Message.sender))
			.limit(1)
		)
		message = message.first()
		if message:
			time = message.timestamp
			time_and_rooms.append((time, room, message))
		else:
			time = room.timestamp
			time_and_rooms.append((time, room, None))

	time_and_rooms: list[tuple[datetime, Room, Message | None]] = sorted(
		time_and_rooms, key=lambda x: x[0], reverse=True
	)

	rooms = []
	for time, room, last_message in time_and_rooms:
		if last_message:
			last_message_sender = last_message.sender.username
			if last_message.file:
				file_name = last_message.file.split(os.sep)[-1]
				last_message_text = file_name
			else:
				last_message_text = last_message.text
		else:
			last_message_sender = None
			last_message_text = ""

		messages_ids = await session.exec(
			select(Message.id).where(Message.room_id == room.id)
		)
		messages_ids = messages_ids.unique().all()

		message_viewed_count = await session.exec(
			select(func.count(MessageViewed.id)).where(
				MessageViewed.message_id.in_(messages_ids),
				MessageViewed.user_id == request.state.user.id,
			)
		)
		message_viewed_count = message_viewed_count.one()

		unread_messages = len(messages_ids) - message_viewed_count

		room = {
			"id": room.id,
			"name": room.name,
			"timestamp": room.timestamp.strftime(DATETIME_FORMAT),
			"last_message_timestamp": time.strftime(DATETIME_FORMAT),
			"last_message_text": last_message_text,
			"last_message_sender": last_message_sender,
			"unread_messages": unread_messages,
		}
		rooms.append(room)

	return {"ok": True, "rooms": rooms}


@router.post("/api/v2/room/")
async def post_room(
	session: SessionDep,
	request: Request,
	room_name_and_subscribers: RoomNameAndSubscribers,
):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	if not room_name_and_subscribers.name:
		return {"ok": False, "error": "Not provided room name."}

	room = Room(
		name=room_name_and_subscribers.name,
		creator_id=request.state.user.id,
		timestamp=datetime.now(),
	)
	session.add(room)
	await session.commit()
	await session.refresh(room)

	room_subscriber = RoomSubscribers(user_id=request.state.user.id, room_id=room.id)
	session.add(room_subscriber)

	if room_name_and_subscribers.subscribers:
		subscribers = await session.exec(
			select(User).where(User.id.in_(room_name_and_subscribers.subscribers))
		)
		subscribers = subscribers.unique().all()
		if subscribers:
			for subscriber in subscribers:
				if subscriber.id == request.state.user.id:
					continue

				room_invitation = RoomInvitation(
					creator_id=request.state.user.id,
					room_id=room.id,
					to_user_id=subscriber.id,
					timestamp=datetime.now(),
				)
				session.add(room_invitation)
			await session.commit()

	await session.refresh(room)
	return {"ok": True, "room": room}


@router.get("/api/v2/invite_chats/")
async def get_room_invitation(session: SessionDep, request: Request):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	query = await session.exec(
		select(RoomInvitation)
		.where(RoomInvitation.to_user_id == request.state.user.id)
		.options(joinedload(RoomInvitation.creator))
		.options(joinedload(RoomInvitation.room))
	)
	query = query.unique().all()

	room_invitations = []
	for room_invitation in query:
		room = {
			"id": room_invitation.id,
			"creator_id": room_invitation.creator_id,
			"room_id": room_invitation.room_id,
			"to_user_id": room_invitation.to_user_id,
			"timestamp": room_invitation.timestamp,
			"room": {
				"id": room_invitation.room.id,
				"name": room_invitation.room.name,
			},
			"creator": {"username": room_invitation.creator.username},
		}
		room_invitations.append(room)

	if not room_invitations:
		return {"ok": False, "error": "Not found room invitations."}

	return {"ok": True, "room_invitations": room_invitations}


@router.post("/api/v2/invite_chats/{user_id}/add_room/{room_id}/")
async def post_room_invitation_add(
	session: SessionDep, request: Request, user_id: int, room_id: int
) -> dict[str, bool]:
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	room_invite = await session.exec(
		select(RoomInvitation).where(
			RoomInvitation.room_id == room_id,
			RoomInvitation.to_user_id == request.state.user.id,
		)
	)
	room_invite = room_invite.first()

	if room_invite:
		await session.exec(
			delete(RoomInvitation).where(RoomInvitation.id == room_invite.id)
		)
		await session.commit()

		room = await session.exec(select(Room).where(Room.id == room_invite.room_id))
		room = room.first()
		user = await session.exec(select(User).where(User.id == user_id))
		user = user.first()

		flag = await session.exec(
			select(RoomSubscribers).where(
				RoomSubscribers.user_id == user.id,
				RoomSubscribers.room_id == room.id,
			)
		)
		flag = flag.unique().all()
		if not flag:
			room_subscriber = RoomSubscribers(user_id=user.id, room_id=room.id)
			session.add(room_subscriber)
			await session.commit()
		else:
			await session.exec(
				delete(RoomInvitation).where(RoomInvitation.id == room_id)
			)
			await session.commit()

	return {"ok": True}


@router.post("/api/v2/invite_chats/{user_id}/remove_room/{room_id}/")
async def post_room_invitation_remove(
	session: SessionDep, request: Request, user_id: int, room_id: int
) -> dict[str, bool]:
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	await session.exec(
		delete(RoomInvitation).where(
			RoomInvitation.to_user_id == user_id,
			RoomInvitation.room_id == room_id,
		)
	)
	await session.commit()

	return {"ok": True}
