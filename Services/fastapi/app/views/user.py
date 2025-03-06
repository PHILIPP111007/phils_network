from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlmodel import delete, select

from app.database import SessionDep
from app.models import (
	DjangoAdminLog,
	Message,
	OnlineStatus,
	Post,
	RoomCreator,
	RoomInvitation,
	RoomSubscribers,
	Subscriber,
	Token,
	User,
)

router = APIRouter(tags=["user"])


class UserBody(BaseModel):
	id: int
	first_name: str
	last_name: str
	email: str


@router.get("/api/v2/user/{username}/")
async def get_user(session: SessionDep, request: Request, username: str):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	query = session.exec(select(User).where(User.id == request.state.user.id)).first()
	if not query:
		return {"ok": False, "error": "Not found the global user."}

	online_status = session.exec(
		select(OnlineStatus).where(OnlineStatus.user_id == query.id)
	).first()
	if online_status:
		user = {
			"id": query.id,
			"username": query.username,
			"email": query.email,
			"first_name": query.first_name,
			"last_name": query.last_name,
			"is_online": online_status.is_online,
		}
	else:
		user = {
			"id": query.id,
			"username": query.username,
			"email": query.email,
			"first_name": query.first_name,
			"last_name": query.last_name,
			"is_online": False,
		}

	global_user = user

	result = {"ok": True, "global_user": global_user}

	query = session.exec(select(User).where(User.username == username)).first()
	if not query:
		return result

	online_status = session.exec(
		select(OnlineStatus).where(OnlineStatus.user_id == query.id)
	).first()
	if online_status:
		user = {
			"id": query.id,
			"username": query.username,
			"email": query.email,
			"first_name": query.first_name,
			"last_name": query.last_name,
			"is_online": online_status.is_online,
		}
	else:
		user = {
			"id": query.id,
			"username": query.username,
			"email": query.email,
			"first_name": query.first_name,
			"last_name": query.last_name,
			"is_online": False,
		}

	result["local_user"] = user
	return result


@router.put("/api/v2/user/")
async def put_user(session: SessionDep, request: Request, user_body: UserBody):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	user = session.exec(select(User).where(User.id == user_body.id)).first()
	if not user:
		return {"ok": False, "error": "Not found user."}

	if user.id != request.state.user.id:
		return {"ok": False, "error": "Access denied."}

	user.first_name = user_body.first_name
	user.last_name = user_body.last_name
	user.email = user_body.email

	session.add(user)
	session.commit()
	session.refresh(user)

	return {"ok": True, "user": user}


@router.delete("/api/v2/user/{username}/")
async def delete_user(
	session: SessionDep, request: Request, username: str
) -> dict[str, bool]:
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	user = session.exec(select(User).where(User.username == username)).first()
	if not user:
		return {"ok": False, "error": "Not found user."}

	if user.id != request.state.user.id:
		return {"ok": False, "error": "Access denied."}

	session.exec(delete(Subscriber).where(Subscriber.user_id == user.id))
	session.exec(delete(Subscriber).where(Subscriber.subscribe_id == user.id))
	session.exec(delete(Token).where(Token.user_id == user.id))
	session.exec(delete(Post).where(Post.user_id == user.id))
	session.exec(delete(OnlineStatus).where(OnlineStatus.user_id == user.id))
	session.exec(delete(RoomCreator).where(RoomCreator.creator_id == user.id))
	session.exec(delete(RoomInvitation).where(RoomInvitation.creator_id == user.id))
	session.exec(delete(RoomInvitation).where(RoomInvitation.to_user_id == user.id))
	session.exec(delete(RoomSubscribers).where(RoomSubscribers.user_id == user.id))
	session.exec(delete(Message).where(Message.sender_id == user.id))
	session.exec(delete(DjangoAdminLog).where(DjangoAdminLog.user_id == user.id))
	session.exec(delete(User).where(User.id == user.id))
	session.commit()

	return {"ok": True}
