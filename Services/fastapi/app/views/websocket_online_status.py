from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlmodel import select

from app.database import SessionDep
from app.models import OnlineStatus, Token

router = APIRouter(tags=["websocket_online_status"])


@router.websocket("/ws/online_status/{user_id}/")
async def websocket_online_status(
	session: SessionDep, websocket: WebSocket, user_id: int, token_key: str = None
):
	async def _get_user_id() -> int | None:
		nonlocal token_key

		token = session.exec(select(Token).where(Token.key == token_key)).first()
		if token:
			return token.user_id
		return

	async def _create_online_status() -> None:
		nonlocal user_id

		online_status = session.exec(
			select(OnlineStatus).where(OnlineStatus.user_id == user_id)
		).first()
		if online_status:
			online_status.is_online = True
			session.add(online_status)
			session.commit()

	async def _remove_online_status() -> None:
		nonlocal user_id

		online_status = session.exec(
			select(OnlineStatus).where(OnlineStatus.user_id == user_id)
		).first()
		if online_status:
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
