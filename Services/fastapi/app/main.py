import json
from datetime import datetime

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from sqlmodel import Session, select

from app.constants import DATETIME_FORMAT
from app.database import SessionDep, engine
from app.models import Message, OnlineStatus, Room, Token, User
from app.views import (
	chat,
	find_user,
	friend,
	message,
	news,
	online_status,
	post,
	room,
	subscriber,
	user,
)

app = FastAPI(
	title="phils_network",
	version="3.0.0",
	description="### Minimalistic social network written using Django, FastAPI and React.",
	contact={
		"name": "Roshchin Philipp",
		"url": "https://github.com/PHILIPP111007",
		"email": "r.phil@yandex.ru",
	},
	license_info={
		"name": "MIT",
		"identifier": "MIT",
	},
)

connected_clients = []


#########################################
# Middleware ############################
#########################################


# Middleware to store user in request context
@app.middleware("http")
async def add_user_to_request(request: Request, call_next):
	token = request.headers.get("Authorization")
	if token:
		token = token.split(" ")[1]  # Remove "Bearer"
		with Session(engine) as session:
			tokens = (
				session.exec(select(Token).where(Token.key == token)).unique().all()
			)
			if tokens:
				token = tokens[0]
				user = session.exec(select(User).where(User.id == token.user_id)).one()
				if user:
					request.state.user = User(id=user.id, username=user.username)
					response = await call_next(request)
					return response
	request.state.user = None
	response = await call_next(request)
	return response


app.include_router(online_status.router)
app.include_router(post.router)
app.include_router(news.router)
app.include_router(subscriber.router)
app.include_router(find_user.router)
app.include_router(friend.router)
app.include_router(room.router)
app.include_router(user.router)
app.include_router(chat.router)
app.include_router(message.router)


########################################
# WebSocket ############################
########################################


@app.websocket("/ws/online_status/{user_id}/")
async def websocket_online_status(
	session: SessionDep, websocket: WebSocket, user_id: int, token_key: str = None
):
	async def _get_user_id() -> int | None:
		nonlocal token_key

		tokens = (
			session.exec(select(Token).where(Token.key == token_key)).unique().all()
		)
		if tokens:
			token = tokens[0]
			return token.user_id
		return

	async def _create_online_status() -> None:
		nonlocal user_id

		online_statuses = (
			session.exec(select(OnlineStatus).where(OnlineStatus.user_id == user_id))
			.unique()
			.all()
		)
		if online_statuses:
			online_status = online_statuses[0]
			online_status.is_online = True
			session.add(online_status)
			session.commit()

	async def _remove_online_status() -> None:
		nonlocal user_id

		online_statuses = (
			session.exec(select(OnlineStatus).where(OnlineStatus.user_id == user_id))
			.unique()
			.all()
		)
		if online_statuses:
			online_status = online_statuses[0]
			online_status.is_online = False
			session.add(online_status)
			session.commit()

	await websocket.accept()
	id = await _get_user_id()
	try:
		while True:
			if not id:
				await websocket.close()
			else:
				await _create_online_status()

			await websocket.receive_text()

	except WebSocketDisconnect:
		await _remove_online_status()


@app.websocket("/ws/chat/{room_id}/")
async def websocket_chat(
	session: SessionDep, websocket: WebSocket, room_id: int, token_key: str = None
):
	async def _get_user_id() -> int | None:
		nonlocal token_key

		tokens = (
			session.exec(select(Token).where(Token.key == token_key)).unique().all()
		)
		if tokens:
			token = tokens[0]
			return token.user_id
		return

	async def _check_permission(id: int) -> bool:
		"""Check if user is this room subscriber."""

		nonlocal room_id

		room = session.exec(select(Room).where(Room.id == room_id)).one()
		room_subscribers_ids: set[int] = set(
			[subscriber.user_id for subscriber in room.room_subscribers]
		)
		flag = id in room_subscribers_ids
		return flag

	async def _create_message(message: dict) -> Message:
		"""Create message."""

		nonlocal room_id

		message = Message(
			sender_id=message["sender_id"],
			room_id=room_id,
			text=message["text"],
			timestamp=datetime.now(),
		)
		session.add(message)
		session.commit()
		session.refresh(message)
		return message

	# await websocket.accept()
	await websocket.accept()
	id = await _get_user_id()

	connected_clients.append(
		{"websocket": websocket, "token_key": token_key, "room_id": room_id}
	)

	if not id:
		await websocket.close()
		connected_clients.remove(
			{"websocket": websocket, "token_key": token_key, "room_id": room_id}
		)
	else:
		flag = await _check_permission(id=id)
		if not flag:
			await websocket.close()
			connected_clients.remove(
				{"websocket": websocket, "token_key": token_key, "room_id": room_id}
			)

	try:
		while True:
			text = await websocket.receive_text()
			text: dict = json.loads(text)
			query = await _create_message(text["message"])

			message = {
				"sender_id": query.sender_id,
				"room_id": query.room_id,
				"text": query.text,
				"timestamp": query.timestamp.strftime(DATETIME_FORMAT),
				"sender": {
					"username": query.sender.username,
					"first_name": query.sender.first_name,
					"last_name": query.sender.last_name,
				},
			}

			connected_clients_by_room = list(
				filter(lambda x: x["room_id"] == room_id, connected_clients)
			)
			for client in connected_clients_by_room:
				await client["websocket"].send_text(
					data=json.dumps(
						{
							"status": True,
							"message": message,
						}
					)
				)

	except WebSocketDisconnect:
		connected_clients.remove(
			{"websocket": websocket, "token_key": token_key, "room_id": room_id}
		)
