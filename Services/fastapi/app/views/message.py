from fastapi import APIRouter, Request
from sqlmodel import select, func
from sqlalchemy.orm import joinedload
from sqlalchemy import and_

from app.constants import DATETIME_FORMAT, MESSAGES_TO_LOAD
from app.database import SessionDep
from app.models import Message, Room, RoomSubscribers, MessageViewed

router = APIRouter(tags=["message"])


@router.get("/api/v2/room/{id}/{loaded_messages}/")
async def get_message(
	session: SessionDep, request: Request, id: int, loaded_messages: int
):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	room = await session.exec(select(Room).where(Room.id == id))
	room = room.first()
	if not room:
		return {"ok": False, "error": "Not found room."}

	flag = await session.exec(
		select(RoomSubscribers).where(
			RoomSubscribers.user_id == request.state.user.id,
			RoomSubscribers.room_id == room.id,
		)
	)
	flag = flag.first()
	if not flag:
		return {"ok": False, "error": "Access denied."}

	query = await session.exec(
		select(Message)
		.where(
			Message.room_id == room.id,
		)
		.offset(loaded_messages)
		.limit(MESSAGES_TO_LOAD)
		.order_by(Message.timestamp.desc())
		.options(joinedload(Message.sender))
	)
	query = query.unique().all()
	if not query:
		return {"ok": False, "error": "Not found messages."}

	messages = []
	for message in query:
		message = {
			"id": message.id,
			"text": message.text,
			"timestamp": message.timestamp.strftime(DATETIME_FORMAT),
			"file": message.file,
			"sender": {
				"username": message.sender.username,
				"first_name": message.sender.first_name,
				"last_name": message.sender.last_name,
				"is_online": message.sender.is_online,
			},
		}
		messages.append(message)

	return {"ok": True, "messages": messages}


@router.get("/api/v2/get_unread_message_count/")
async def get_unread_message_count(session: SessionDep, request: Request):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	unread_messages_query = (
		select(func.count(Message.id))
		.join(Room, Room.id == Message.room_id)
		.join(RoomSubscribers, Room.id == RoomSubscribers.room_id)
		.outerjoin(
			MessageViewed,
			and_(
				Message.id == MessageViewed.message_id,
				MessageViewed.user_id == request.state.user.id,
			),
		)
		.where(
			RoomSubscribers.user_id
			== request.state.user.id,  # Выбираем комнаты пользователя
			Message.sender_id
			!= request.state.user.id,  # Только сообщения от других пользователей
			MessageViewed.id.is_(None),  # Сообщения, которые пользователь не читал
		)
	)

	unread_messages_count = await session.exec(unread_messages_query)
	unread_messages_count = unread_messages_count.one()

	return {"ok": True, "unread_messages_count": unread_messages_count}
