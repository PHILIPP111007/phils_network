from zoneinfo import ZoneInfo

from fastapi import APIRouter, Request
from sqlalchemy import and_
from sqlalchemy.orm import joinedload
from sqlmodel import delete, func, select

from app.constants import (
	DATETIME_FORMAT,
	MESSAGES_TO_LOAD,
	USER_IMAGE_PATH,
)
from app.database import SessionDep
from app.models import Message, MessageLike, MessageViewed, Room, RoomSubscribers
from app.modules import get_file_content, get_file_content_gzip

router = APIRouter(tags=["message"])


def _filter_message(msg: dict, messages_ids: list[int]):
	if msg["parent_id"] not in messages_ids:
		return msg

	if msg["parent"] is not None:
		return msg


@router.get("/room/{id}/{loaded_messages}/")
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
		.options(joinedload(Message.likes))
	)
	query = query.unique().all()
	if not query:
		return {"ok": False, "error": "Not found messages."}

	messages = []
	for message in query:
		if message.parent_id is not None:
			if request.state.user.user_timezone:
				user_timezone = request.state.user.user_timezone
				timezone_obj = ZoneInfo(user_timezone)
				timestamp = message.reply.timestamp.astimezone(timezone_obj)
			else:
				timestamp = message.reply.timestamp

			parent = {
				"sender_id": message.reply.sender_id,
				"text": message.reply.text,
				"timestamp": timestamp.strftime(DATETIME_FORMAT),
				"sender": {
					"username": message.reply.sender.username,
					"first_name": message.reply.sender.first_name,
					"last_name": message.reply.sender.last_name,
					"is_online": message.reply.sender.is_online,
				},
				"file": await get_file_content_gzip(file_name=message.reply.file),
			}
		else:
			parent = None

		if request.state.user.user_timezone:
			user_timezone = request.state.user.user_timezone
			timezone_obj = ZoneInfo(user_timezone)
			timestamp = message.timestamp.astimezone(timezone_obj)
		else:
			timestamp = message.timestamp

		image_path = USER_IMAGE_PATH.format(message.sender.id)

		message = {
			"id": message.id,
			"text": message.text,
			"timestamp": timestamp.strftime(DATETIME_FORMAT),
			"parent_id": message.parent_id,
			"file": await get_file_content_gzip(file_name=message.file),
			"sender": {
				"username": message.sender.username,
				"first_name": message.sender.first_name,
				"last_name": message.sender.last_name,
				"is_online": message.sender.is_online,
				"image": await get_file_content(file_name=image_path),
			},
			"parent": parent,
			"likes": len(message.likes),
		}
		messages.append(message)

	messages_ids = list(map(lambda msg: msg["id"], messages))
	messages = list(
		filter(
			lambda msg: _filter_message(msg=msg, messages_ids=messages_ids), messages
		)
	)

	return {"ok": True, "messages": messages}


@router.get("/get_unread_message_count/")
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


@router.post("/like_message/{message_id}/")
async def post_message_like(session: SessionDep, request: Request, message_id: int):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	message = await session.exec(select(Message).where(Message.id == message_id))
	message = message.first()
	if not message:
		return {"ok": False, "error": "Not found message."}

	message_like = await session.exec(
		select(MessageLike).where(
			MessageLike.user_id == request.state.user.id,
			MessageLike.message_id == message_id,
		)
	)
	message_like = message_like.first()
	if message_like:
		return {"ok": False, "error": "Current message has your like."}

	message_like = MessageLike(user_id=request.state.user.id, message_id=message_id)
	session.add(message_like)
	await session.commit()

	return {"ok": True}


@router.post("/unlike_message/{message_id}/")
async def post_message_unlike(session: SessionDep, request: Request, message_id: int):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	message = await session.exec(select(Message).where(Message.id == message_id))
	message = message.first()
	if not message:
		return {"ok": False, "error": "Not found message."}

	await session.exec(
		delete(MessageLike).where(
			MessageLike.user_id == request.state.user.id,
			MessageLike.message_id == message_id,
		)
	)
	await session.commit()

	return {"ok": True}
