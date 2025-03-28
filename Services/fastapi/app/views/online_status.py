from fastapi import APIRouter, Request
from sqlmodel import select

from app.database import SessionDep
from app.models import User

router = APIRouter(tags=["online_status"])


@router.post("/api/v2/online_status/set_true/")
async def post_online_status_true(
	session: SessionDep, request: Request
) -> dict[str, bool]:
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	user = session.exec(select(User).where(User.id == request.state.user.id)).first()
	user.is_online = True
	session.add(user)
	session.commit()

	return {"ok": True}


@router.post("/api/v2/online_status/set_false/")
async def post_online_status_false(session: SessionDep, request: Request):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	user = session.exec(select(User).where(User.id == request.state.user.id)).first()
	user.is_online = False
	session.add(user)
	session.commit()

	return {"ok": True}
