import json
from datetime import datetime

from fastapi import APIRouter, Request
from sqlmodel import delete, select

from app.constants import DATETIME_FORMAT
from app.database import SessionDep
from app.models import (
	Message,
	Room,
	RoomCreator,
	RoomInvitation,
	RoomSubscribers,
	User,
)

router = APIRouter(tags=["chat"])


@router.get("/api/v2/room/{id}/")
async def get_chat(session: SessionDep, request: Request, id: int):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	room = session.exec(select(Room).where(Room.id == id)).one()
	if not room:
		return {"ok": False, "error": "Not found room."}

	room_creator = session.exec(
		select(RoomCreator).where(RoomCreator.room_id == id)
	).one()
	if not room_creator:
		return {"ok": False, "error": "Not found room creator."}

	is_creator = room_creator.creator_id == request.state.user.id

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


@router.put("/api/v2/room/{id}/")
async def put_chat(session: SessionDep, request: Request, id: int) -> dict[str, bool]:
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	body = await request.body()
	body: dict = json.loads(body)

	friends: list | None = body.get("friends")
	subscribers: list | None = body.get("subscribers")

	room = session.exec(select(Room).where(Room.id == id)).one()
	if not room:
		return {"ok": False, "error": "Not found room."}

	if friends:
		friends = session.exec(select(User).where(User.id.in_(friends))).unique().all()
		for friend in friends:
			room_invitation = RoomInvitation(
				creator_id=request.state.user.id,
				to_user_id=friend.id,
				room_id=room.id,
				timestamp=datetime.now(),
			)
			session.add(room_invitation)
			session.commit()

	if subscribers:
		for user_id in subscribers:
			if user_id == request.state.user.id:
				continue
			session.exec(
				delete(RoomSubscribers).where(
					RoomSubscribers.user_id == user_id,
					RoomSubscribers.room_id == room.id,
				)
			)
		session.commit()

	if not room.room_subscribers:
		session.exec(delete(Room).where(Room.id == room.id))
		session.exec(delete(Message).where(Message.room_id == room.id))
		session.exec(delete(RoomCreator).where(RoomCreator.room_id == room.id))
		session.exec(delete(RoomInvitation).where(RoomInvitation.room_id == room.id))
		session.exec(delete(RoomSubscribers).where(RoomSubscribers.room_id == room.id))
		session.commit()

	return {"ok": True}
