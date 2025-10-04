import os
import shutil
import gzip
import base64
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Request
from sqlmodel import select, func
from sqlalchemy.orm import joinedload
from sqlalchemy import and_

from app.constants import (
	DATETIME_FORMAT,
	MESSAGES_TO_LOAD,
	BUCKET_NAME,
	MEDIA_ROOT,
	MAX_ALLOWED_FILE_SIZE_FOR_PREVIEW,
)
from app.database import SessionDep
from app.models import Message, Room, RoomSubscribers, MessageViewed
from app.s3 import s3


router = APIRouter(tags=["message"])


async def _get_file_content(file_name: str):
	try:
		file_path = file_name
		with open(file_path, "wb") as file:
			s3.download_fileobj(BUCKET_NAME, file_path, file)
		with open(file_path, "rb") as file:
			content = file.read()
			content_base64 = base64.b64encode(content).decode("utf-8")
	except Exception:
		content_base64 = None

	return content_base64


async def _get_file_content_gzip(file_name: str):
	if not file_name:
		return {"path": file_name, "content": None}

	file_path = os.path.join(MEDIA_ROOT, file_name)
	compressed_file_path = file_path + ".gz"
	uncompressed_file_path = file_path

	response = s3.head_object(Bucket=BUCKET_NAME, Key=file_path)
	file_size = response["ContentLength"]

	if file_size > MAX_ALLOWED_FILE_SIZE_FOR_PREVIEW:
		return {"path": file_name, "content": None}

	folders_to_create = file_path.split(os.path.sep)[:-1]
	folders_to_create = os.path.sep.join(folders_to_create)

	os.makedirs(folders_to_create, exist_ok=True)

	# Скачиваем файл
	with open(compressed_file_path, "wb") as file:
		s3.download_fileobj(BUCKET_NAME, file_path, file)

	# Разжимаем файл
	with gzip.open(compressed_file_path, "rb") as f_in:
		with open(uncompressed_file_path, "wb") as f_out:
			shutil.copyfileobj(f_in, f_out)

	# Читаем контент
	with open(uncompressed_file_path, "rb") as file:
		content = file.read()
		content_base64 = base64.b64encode(content).decode("utf-8")

	# Удаляем временные файлы
	os.remove(compressed_file_path)
	os.remove(uncompressed_file_path)

	return {"path": uncompressed_file_path, "content": content_base64}


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
		if request.state.user.user_timezone:
			user_timezone = request.state.user.user_timezone
			timezone_obj = ZoneInfo(user_timezone)
			timestamp = message.timestamp.replace(tzinfo=timezone_obj)
		else:
			timestamp = message.timestamp

		message = {
			"id": message.id,
			"text": message.text,
			"timestamp": timestamp.strftime(DATETIME_FORMAT),
			"file": await _get_file_content_gzip(file_name=message.file),
			"sender": {
				"username": message.sender.username,
				"first_name": message.sender.first_name,
				"last_name": message.sender.last_name,
				"is_online": message.sender.is_online,
				"image": await _get_file_content(file_name=message.sender.image),
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
