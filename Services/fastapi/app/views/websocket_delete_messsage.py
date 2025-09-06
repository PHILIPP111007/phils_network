import json
import os

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlmodel import delete, select

from app.constants import BUCKET_NAME, MEDIA_ROOT
from app.database import SessionDep
from app.models import Message, MessageViewed, Room, Token
from app.s3 import s3

router = APIRouter(tags=["websocket_delete_messsage"])


connected_clients: dict[str, list] = {}


@router.websocket("/ws/v2/chat/{room_id}/delete_message/")
async def websocket_delete_messsage(
	session: SessionDep, websocket: WebSocket, room_id: int, token_key: str = None
):
	async def _get_user_id() -> int | None:
		nonlocal token_key

		token = session.exec(select(Token).where(Token.key == token_key)).first()
		if token:
			return token.user_id

	async def _check_permission(user_id: int) -> bool:
		"""Check if user is this room subscriber."""

		nonlocal room_id

		room = session.exec(select(Room).where(Room.id == room_id)).one()
		room_subscribers_ids: set[int] = set(
			[subscriber.user_id for subscriber in room.room_subscribers]
		)
		flag = user_id in room_subscribers_ids
		return flag

	async def _delete_message(message_id: int) -> Message:
		"""Delete message."""

		nonlocal room_id

		message = session.exec(select(Message).where(Message.id == message_id)).first()
		if message.file:
			file_path = os.path.join(MEDIA_ROOT, message.file)
			s3.delete_object(Bucket=BUCKET_NAME, Key=file_path)

		session.exec(
			delete(MessageViewed).where(MessageViewed.message_id == message_id)
		)
		session.exec(delete(Message).where(Message.id == message_id))
		session.commit()

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
			await _delete_message(text["message_id"])

			for client in connected_clients[room_id]:
				await client["websocket"].send_text(
					data=json.dumps(
						{
							"status": True,
							"message_id": text["message_id"],
						}
					)
				)

	except WebSocketDisconnect:
		connected_clients[room_id].remove(
			{"websocket": websocket, "token_key": token_key}
		)
