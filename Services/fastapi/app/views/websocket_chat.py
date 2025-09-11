import json
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlmodel import select

from app.constants import DATETIME_FORMAT
from app.database import SessionDep
from app.models import Message, MessageViewed, Room, Token

router = APIRouter(tags=["websocket_chat"])


connected_clients: dict[str, list] = {}


@router.websocket("/ws/v2/chat/{room_id}/")
async def websocket_chat(
	session: SessionDep, websocket: WebSocket, room_id: int, token_key: str = None
):
	async def _get_user_id() -> int | None:
		nonlocal token_key

		token = await session.exec(select(Token).where(Token.key == token_key))
		token = token.first()
		if token:
			return token.user_id

	async def _check_permission(user_id: int) -> bool:
		"""Check if user is this room subscriber."""

		nonlocal room_id

		room = await session.exec(select(Room).where(Room.id == room_id))
		room = room.one()
		room_subscribers_ids: set[int] = set(
			[subscriber.user_id for subscriber in room.room_subscribers]
		)
		flag = user_id in room_subscribers_ids
		return flag

	async def _create_message(message: dict) -> Message:
		"""Create message."""

		nonlocal room_id

		new_message = Message(
			sender_id=message["sender_id"],
			room_id=room_id,
			text=message["text"],
			file=message["file"],
			timestamp=datetime.now(),
		)

		if message.get("id"):
			new_message.id = message["id"]

		if message["save"]:
			session.add(new_message)
			await session.commit()
			await session.refresh(new_message)
			new_message_sender: dict = new_message.sender.model_dump()
		else:
			new_message_sender = message["sender"]

		new_message = new_message.model_dump()
		new_message["sender"] = new_message_sender

		message_viewed = MessageViewed(
			user_id=message["sender_id"], message_id=new_message["id"]
		)
		session.add(message_viewed)
		await session.commit()

		return new_message

	await websocket.accept()

	user_id = await _get_user_id()
	if not user_id:
		await websocket.close()
		return
	else:
		flag = await _check_permission(user_id=user_id)
		if not flag:
			await websocket.close()
			return

	connected_clients.setdefault(room_id, []).append(
		{
			"websocket": websocket,
			"token_key": token_key,
		}
	)

	try:
		while True:
			text = await websocket.receive_text()
			text: dict = json.loads(text)
			query = await _create_message(text["message"])

			message = {
				"id": query["id"],
				"sender_id": query["sender_id"],
				"room_id": query["room_id"],
				"text": query["text"],
				"file": query["file"],
				"timestamp": query["timestamp"].strftime(DATETIME_FORMAT),
				"sender": {
					"username": query["sender"]["username"],
					"first_name": query["sender"]["first_name"],
					"last_name": query["sender"]["last_name"],
				},
			}

			for client in connected_clients[room_id]:
				await client["websocket"].send_text(
					data=json.dumps(
						{
							"status": True,
							"message": message,
						}
					)
				)

	except WebSocketDisconnect:
		connected_clients[room_id].remove(
			{"websocket": websocket, "token_key": token_key}
		)
