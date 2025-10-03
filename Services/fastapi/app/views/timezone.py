from fastapi import APIRouter, Request
from sqlmodel import select

from app.database import SessionDep
from app.request_body import TimezoneData
from app.models import User

router = APIRouter(tags=["timezone"])


@router.post("/api/v2/timezone/")
async def post_timezone(session: SessionDep, request: Request, body: TimezoneData):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}
    


    query = await session.exec(select(User).where(User.id == request.state.user.id))
    user = query.first()
    if not user:
        return {"ok": False, "error": "Not found the global user."}
    
    user.user_timezone = body.timezone

    session.add(user)
    await session.commit()

    return {"ok": True}