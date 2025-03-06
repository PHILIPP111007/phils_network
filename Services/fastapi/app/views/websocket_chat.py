import json
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlmodel import select

from app.constants import DATETIME_FORMAT
from app.database import SessionDep
from app.models import (
	Message,
	Room,
	Token,
)

router = APIRouter(tags=["websocket_chat"])


connected_clients = []


@router.websocket("/ws/chat/{room_id}/")
async def websocket_chat(
	session: SessionDep, websocket: WebSocket, room_id: int, token_key: str = None
):
	async def _get_user_id() -> int | None:
		nonlocal token_key

		token = session.exec(select(Token).where(Token.key == token_key)).first()
		if token:
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
