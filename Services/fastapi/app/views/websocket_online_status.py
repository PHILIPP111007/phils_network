from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlmodel import select

from app.database import SessionDep
from app.models import Token, User

router = APIRouter(tags=["websocket_online_status"])


@router.websocket("/ws/v2/online_status/{user_id}/")
async def websocket_online_status(
	session: SessionDep, websocket: WebSocket, user_id: int, token_key: str = None
):
	async def _get_user_id() -> int | None:
		nonlocal token_key

		token = await session.exec(select(Token).where(Token.key == token_key))
		token = token.first()
		if token:
			return token.user_id

	async def _online_status_set_true() -> None:
		nonlocal user_id

		user = await session.exec(select(User).where(User.id == user_id))
		user = user.first()
		user.is_online = True
		session.add(user)
		await session.commit()

	async def _online_status_set_false() -> None:
		nonlocal user_id

		user = await session.exec(select(User).where(User.id == user_id))
		user = user.first()
		user.is_online = False
		session.add(user)
		await session.commit()

	await websocket.accept()
	id = await _get_user_id()
	try:
		while True:
			if not id:
				await websocket.close()
			else:
				await _online_status_set_true()

			await websocket.receive_text()

	except WebSocketDisconnect:
		await _online_status_set_false()
