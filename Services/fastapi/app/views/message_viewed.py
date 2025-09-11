from fastapi import APIRouter, Request
from sqlmodel import select

from app.database import SessionDep
from app.models import MessageViewed

router = APIRouter(tags=["message_viewed"])


@router.post("/api/v2/message_viewed/{message_id}/")
async def post_message_viewed(
	session: SessionDep, request: Request, message_id: int
) -> dict[str, bool]:
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	message_viewed = await session.exec(
		select(MessageViewed).where(
			MessageViewed.message_id == message_id,
			MessageViewed.user_id == request.state.user.id,
		)
	)
	message_viewed = message_viewed.first()

	if not message_viewed:
		message_viewed = MessageViewed(
			message_id=message_id, user_id=request.state.user.id
		)
		session.add(message_viewed)
		await session.commit()
	return {"ok": True}
