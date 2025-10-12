import os
from datetime import datetime

from fastapi import APIRouter, Request
from sqlmodel import delete, select
from sqlalchemy.orm import joinedload

from app.constants import BUCKET_NAME, DATETIME_FORMAT, MEDIA_ROOT
from app.database import SessionDep
from app.models import (
	Message,
	Room,
	RoomInvitation,
	RoomSubscribers,
)
from app.request_body import FriendsAndSubscribers
from app.s3 import s3

router = APIRouter(tags=["chat"])


@router.get("/room/{id}/")
async def get_chat(session: SessionDep, request: Request, id: int):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	room = await session.exec(
		select(Room)
		.where(Room.id == id)
		.options(joinedload(Room.room_subscribers).joinedload(RoomSubscribers.user))
	)
	room = room.first()

	if not room:
		return {"ok": False, "error": "Not found room."}

	is_creator = room.creator_id == request.state.user.id

	subscribers_info = [
		{
			"id": subscriber.user.id,
			"username": subscriber.user.username,
			"first_name": subscriber.user.first_name,
			"last_name": subscriber.user.last_name,
		}
		for subscriber in room.room_subscribers
	]

	room = {
		"id": room.id,
		"name": room.name,
		"timestamp": room.timestamp.strftime(DATETIME_FORMAT),
		"subscribers_info": subscribers_info,
	}

	return {
		"ok": True,
		"isCreator": is_creator,
		"room": room,
	}


@router.put("/room/{id}/")
async def put_chat(
	session: SessionDep,
	request: Request,
	id: int,
	friends_and_subscribers: FriendsAndSubscribers,
):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	room = await session.exec(
		select(Room)
		.where(Room.id == id)
		.options(joinedload(Room.room_subscribers).joinedload(RoomSubscribers.user))
	)
	room = room.first()

	room_subscribers_ids: set[int] = set(
		[subscriber.user_id for subscriber in room.room_subscribers]
	)

	if not room:
		return {"ok": False, "error": "Not found room."}

	if friends_and_subscribers.friends:
		for friend_id in friends_and_subscribers.friends:
			room_invitation = await session.exec(
				select(RoomInvitation).where(
					RoomInvitation.creator_id == request.state.user.id,
					RoomInvitation.to_user_id == friend_id,
					RoomInvitation.room_id == room.id,
				)
			)
			room_invitation = room_invitation.first()

			if not room_invitation:
				room_invitation = RoomInvitation(
					creator_id=request.state.user.id,
					to_user_id=friend_id,
					room_id=room.id,
				)
				session.add(room_invitation)
		await session.commit()

	if friends_and_subscribers.subscribers:
		for user_id in friends_and_subscribers.subscribers:
			await session.exec(
				delete(RoomSubscribers).where(
					RoomSubscribers.user_id == user_id,
					RoomSubscribers.room_id == room.id,
				)
			)
		await session.commit()

	if len(room_subscribers_ids) == 0:
		messages = await session.exec(select(Message).where(Message.room_id == room.id))
		messages = messages.unique().all()

		for message in messages:
			if message.file:
				file_path = os.path.join(MEDIA_ROOT, message.file)
				s3.delete_object(Bucket=BUCKET_NAME, Key=file_path)

		await session.exec(delete(Room).where(Room.id == room.id))
		await session.exec(delete(Message).where(Message.room_id == room.id))
		await session.exec(
			delete(RoomInvitation).where(RoomInvitation.room_id == room.id)
		)
		await session.exec(
			delete(RoomSubscribers).where(RoomSubscribers.room_id == room.id)
		)
		await session.commit()

	return {"ok": True}
