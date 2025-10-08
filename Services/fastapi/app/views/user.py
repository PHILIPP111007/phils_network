import os
import tempfile
import base64

from fastapi import APIRouter, Request, UploadFile, File
from sqlmodel import delete, select

from app.constants import BUCKET_NAME, MEDIA_ROOT, USER_IMAGE_PATH
from app.database import SessionDep
from app.request_body import UserBody
from app.models import (
	DjangoAdminLog,
	Message,
	MessageViewed,
	Post,
	Room,
	RoomInvitation,
	RoomSubscribers,
	Subscriber,
	Token,
	User,
)
from app.s3 import s3

router = APIRouter(tags=["user"])


@router.get("/api/v2/user/{username}/")
async def get_user(session: SessionDep, request: Request, username: str):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	query = await session.exec(select(User).where(User.id == request.state.user.id))
	query = query.first()
	if not query:
		return {"ok": False, "error": "Not found the global user."}

	user = {
		"id": query.id,
		"username": query.username,
		"email": query.email,
		"first_name": query.first_name,
		"last_name": query.last_name,
		"is_online": query.is_online,
		"ethereum_address": query.ethereum_address,
		"infura_api_key": query.infura_api_key,
	}

	global_user = user

	result = {"ok": True, "global_user": global_user}

	query = await session.exec(select(User).where(User.username == username))
	query = query.first()
	if not query:
		return result
	try:
		file_path = f"user_{query.id}"
		with open(file_path, "wb") as file:
			s3.download_fileobj(BUCKET_NAME, file_path, file)
		with open(file_path, "rb") as file:
			content = file.read()
			content_base64 = base64.b64encode(content).decode("utf-8")
	except Exception:
		content_base64 = None

	user = {
		"id": query.id,
		"username": query.username,
		"email": query.email,
		"first_name": query.first_name,
		"last_name": query.last_name,
		"is_online": query.is_online,
		"image": content_base64,
		"ethereum_address": query.ethereum_address,
		"infura_api_key": query.infura_api_key,
	}

	result["local_user"] = user
	return result


@router.put("/api/v2/user/")
async def put_user(
	session: SessionDep,
	request: Request,
	user_body: UserBody,
):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	user = await session.exec(select(User).where(User.id == request.state.user.id))
	user = user.first()
	if not user:
		return {"ok": False, "error": "Not found user."}

	user.first_name = user_body.first_name
	user.last_name = user_body.last_name
	user.email = user_body.email

	user.ethereum_address = user_body.ethereum_address
	user.infura_api_key = user_body.infura_api_key

	session.add(user)
	await session.commit()
	await session.refresh(user)

	return {"ok": True, "user": user}


@router.put("/api/v2/user_image/")
async def put_user_image(
	session: SessionDep,
	request: Request,
	image: UploadFile = File(...),
):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	user = await session.exec(select(User).where(User.id == request.state.user.id))
	user = user.first()
	if not user:
		return {"ok": False, "error": "Not found user."}

	if image:
		image_path = USER_IMAGE_PATH.format(user.id)

		with tempfile.NamedTemporaryFile() as temp_file:
			with open(temp_file.name, "wb") as f_out:
				content = await image.read()
				f_out.write(content)

			s3.upload_file(temp_file.name, BUCKET_NAME, image_path)
			user.image = image_path

	session.add(user)
	await session.commit()
	await session.refresh(user)

	return {"ok": True, "user": user}


@router.delete("/api/v2/user/{username}/")
async def delete_user(session: SessionDep, request: Request, username: str):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	user = await session.exec(select(User).where(User.username == username))
	user = user.first()
	if not user:
		return {"ok": False, "error": "Not found user."}

	if user.id != request.state.user.id:
		return {"ok": False, "error": "Access denied."}

	room_subscribers = await session.exec(
		select(RoomSubscribers.room_id).where(RoomSubscribers.user_id == user.id)
	)
	room_subscribers = room_subscribers.unique().all()

	rooms = await session.exec(select(Room).where(Room.id.in_(room_subscribers)))
	rooms = rooms.unique().all()

	await session.exec(
		delete(RoomSubscribers).where(RoomSubscribers.user_id == user.id)
	)
	await session.commit()

	for room in rooms:
		if not room.room_subscribers:
			await session.exec(delete(Room).where(Room.id == room.id))

	messages = await session.exec(select(Message).where(Message.sender_id == user.id))
	messages = messages.unique().all()

	message_ids = []
	for message in messages:
		message_ids.append(message.id)
		if message.file:
			file_path = os.path.join(MEDIA_ROOT, message.file)
			s3.delete_object(Bucket=BUCKET_NAME, Key=file_path)

	rooms = await session.exec(select(Room).where(Room.creator_id == user.id))
	rooms = rooms.unique().all()
	for room in rooms:
		room.creator = None
		session.add(room)
	await session.exec(
		delete(MessageViewed).where(MessageViewed.message_id.in_(message_ids))
	)
	await session.exec(delete(MessageViewed).where(MessageViewed.user_id == user.id))
	await session.exec(delete(Subscriber).where(Subscriber.user_id == user.id))
	await session.exec(delete(Subscriber).where(Subscriber.subscribe_id == user.id))
	await session.exec(delete(Token).where(Token.user_id == user.id))
	await session.exec(delete(Post).where(Post.user_id == user.id))
	await session.exec(
		delete(RoomInvitation).where(RoomInvitation.creator_id == user.id)
	)
	await session.exec(
		delete(RoomInvitation).where(RoomInvitation.to_user_id == user.id)
	)
	await session.exec(delete(Message).where(Message.sender_id == user.id))
	await session.exec(delete(DjangoAdminLog).where(DjangoAdminLog.user_id == user.id))
	await session.exec(delete(User).where(User.id == user.id))
	await session.commit()

	return {"ok": True}
