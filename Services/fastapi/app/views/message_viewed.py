from fastapi import APIRouter, Request

from app.database import SessionDep
from app.models import MessageViewed

router = APIRouter(tags=["message_viewed"])


@router.post("/api/v2/message_viewed/{message_id}/")
async def post_message_viewed(session: SessionDep, request: Request, message_id: int):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	message_viewed = MessageViewed(message_id=message_id, user_id=request.state.user.id)
	session.add(message_viewed)
	session.commit()
	return {"ok": True}
