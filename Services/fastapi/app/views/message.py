from fastapi import APIRouter, Request
from sqlmodel import select

from app.constants import DATETIME_FORMAT, MESSAGES_TO_LOAD
from app.database import SessionDep
from app.models import Message, Room, RoomSubscribers

router = APIRouter(tags=["message"])


@router.get("/api/v2/room/{id}/{loaded_messages}/")
async def get_message(
	session: SessionDep, request: Request, id: int, loaded_messages: int
):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	room = session.exec(select(Room).where(Room.id == id)).one()
	if not room:
		return {"ok": False, "error": "Not found room."}

	flag = (
		session.exec(
			select(RoomSubscribers).where(
				RoomSubscribers.user_id == request.state.user.id,
				RoomSubscribers.room_id == room.id,
			)
		)
		.unique()
		.all()
	)
	if not flag:
		return {"ok": False, "error": "Access denied."}

	query = (
		session.exec(
			select(Message)
			.where(
				Message.room_id == room.id,
			)
			.offset(loaded_messages)
			.limit(MESSAGES_TO_LOAD)
			.order_by(Message.timestamp.desc())
		)
		.unique()
		.all()
	)
	if not query:
		return {"ok": False, "error": "Not found messages."}

	messages = []
	for message in query:
		message = {
			"text": message.text,
			"timestamp": message.timestamp.strftime(DATETIME_FORMAT),
			"sender": {
				"username": message.sender.username,
				"first_name": message.sender.first_name,
				"last_name": message.sender.last_name,
			},
		}
		messages.append(message)

	return {"ok": True, "messages": messages}
