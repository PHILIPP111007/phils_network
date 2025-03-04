import json
from datetime import datetime

from fastapi import APIRouter, Request
from sqlmodel import delete, select

from app.constants import DATETIME_FORMAT
from app.database import SessionDep
from app.models import Message, Room, RoomCreator, RoomInvitation, RoomSubscribers, User

router = APIRouter(tags=["room"])


@router.get("/api/v2/room/")
async def get_room(session: SessionDep, request: Request):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	room_ids = session.exec(
		select(RoomSubscribers.room_id).where(
			RoomSubscribers.user_id == request.state.user.id
		)
	).all()
	rooms = session.exec(select(Room).where(Room.id.in_(room_ids))).unique().all()

	time_and_rooms = []
	for room in rooms:
		messages = (
			session.exec(
				select(Message)
				.where(Message.room_id == room.id)
				.order_by(Message.timestamp.desc())
			)
			.unique()
			.all()
		)
		if messages:
			time = messages[0].timestamp
			time_and_rooms.append((time, room, messages[0]))
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
			last_message_text = last_message.text
		else:
			last_message_sender = None
			last_message_text = ""

		room = {
			"id": room.id,
			"name": room.name,
			"timestamp": room.timestamp.strftime(DATETIME_FORMAT),
			"last_message_timestamp": time.strftime(DATETIME_FORMAT),
			"last_message_text": last_message_text,
			"last_message_sender": last_message_sender,
		}
		rooms.append(room)

	return {"ok": True, "rooms": rooms}


@router.post("/api/v2/room/")
async def post_room(session: SessionDep, request: Request):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	body = await request.body()
	body: dict = json.loads(body)

	room_name = body.get("name")
	if room_name is None:
		return {"ok": False, "error": "Not provided room name."}

	room = Room(name=room_name, timestamp=datetime.now())
	session.add(room)
	session.commit()
	session.refresh(room)

	room_subscriber = RoomSubscribers(user_id=request.state.user.id, room_id=room.id)
	session.add(room_subscriber)
	session.commit()

	room_creator = RoomCreator(creator_id=request.state.user.id, room_id=room.id)
	session.add(room_creator)
	session.commit()

	subscribers_id_list: list[int] | None = body.get("subscribers")
	if subscribers_id_list:
		subscribers = (
			session.exec(select(User).where(User.id.in_(subscribers_id_list)))
			.unique()
			.all()
		)
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
				session.commit()

	session.refresh(room)
	return {"ok": True, "room": room}


@router.get("/api/v2/invite_chats/{username}/")
async def get_room_invitation(session: SessionDep, request: Request, username: str):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	query = (
		session.exec(
			select(RoomInvitation).where(
				RoomInvitation.to_user_id == request.state.user.id
			)
		)
		.unique()
		.all()
	)

	rooms = []
	for room in query:
		room = {
			"id": room.id,
			"creator_id": room.creator_id,
			"room_id": room.room_id,
			"to_user_id": room.to_user_id,
			"timestamp": room.timestamp,
			"room": {
				"id": room.room.id,
				"name": room.room.name,
			},
			"creator": {"username": room.creator.username},
		}
		rooms.append(room)

	if not rooms:
		return {"ok": False, "error": "Not found rooms."}

	return {"ok": True, "rooms": rooms}


@router.post("/api/v2/invite_chats/{username}/add_room/{room_id}/")
async def post_room_invitation_add(
	session: SessionDep, request: Request, username: str, room_id: int
) -> dict[str, bool]:
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	room_invite = session.exec(
		select(RoomInvitation).where(RoomInvitation.id == room_id)
	).one()

	room_creator = session.exec(
		select(RoomCreator).where(RoomCreator.room_id == room_invite.room_id)
	).one()

	if room_creator:
		session.exec(delete(RoomInvitation).where(RoomInvitation.id == room_invite.id))
		room = session.exec(select(Room).where(Room.id == room_creator.room_id)).one()
		user = session.exec(select(User).where(User.username == username)).one()

		flag = (
			session.exec(
				select(RoomSubscribers).where(
					RoomSubscribers.user_id == user.id,
					RoomSubscribers.room_id == room.id,
				)
			)
			.unique()
			.all()
		)
		if not flag:
			room_subscriber = RoomSubscribers(user_id=user.id, room_id=room.id)
			session.add(room_subscriber)
			session.commit()
		else:
			session.exec(delete(RoomInvitation).where(RoomInvitation.id == room_id))
			session.commit()

	return {"ok": True}


@router.post("/api/v2/invite_chats/{username}/remove_room/{room_id}/")
async def post_room_invitation_remove(
	session: SessionDep, request: Request, username: str, room_id: int
) -> dict[str, bool]:
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	session.exec(delete(RoomInvitation).where(RoomInvitation.id == room_id))
	session.commit()

	return {"ok": True}
