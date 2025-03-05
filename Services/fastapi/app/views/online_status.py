from fastapi import APIRouter, Request
from sqlmodel import delete, select

from app.database import SessionDep
from app.models import OnlineStatus

router = APIRouter(tags=["online_status"])


@router.post("/api/v2/online_status/")
async def post_online_status(session: SessionDep, request: Request) -> dict[str, bool]:
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	online_statuses = session.exec(
		select(OnlineStatus).where(OnlineStatus.user_id == request.state.user.id)
	).all()

	if not online_statuses:
		online_status = OnlineStatus(is_online=False, user_id=request.state.user.id)
		session.add(online_status)
		session.commit()

	return {"ok": True}


@router.delete("/api/v2/online_status/")
async def delete_online_status(session: SessionDep, request: Request):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	session.exec(
		delete(OnlineStatus).where(OnlineStatus.user_id == request.state.user.id)
	)
	session.commit()

	return {"ok": True}
