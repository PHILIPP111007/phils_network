import json

from fastapi import APIRouter, Request
from sqlmodel import delete, select

from app.database import SessionDep
from app.models import Message, OnlineStatus, Post, Subscriber, Token, User

router = APIRouter(tags=["user"])


@router.get("/api/v2/user/{username}/")
async def get_user(session: SessionDep, request: Request, username: str):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	users = []
	query = (
		session.exec(select(User).where(User.id == request.state.user.id))
		.unique()
		.all()
	)
	for user in query:
		online_status = session.exec(
			select(OnlineStatus).where(OnlineStatus.user_id == user.id)
		).one()
		if online_status:
			user = {
				"id": user.id,
				"username": user.username,
				"email": user.email,
				"first_name": user.first_name,
				"last_name": user.last_name,
				"is_online": online_status.is_online,
			}
		else:
			user = {
				"id": user.id,
				"username": user.username,
				"email": user.email,
				"first_name": user.first_name,
				"last_name": user.last_name,
				"is_online": False,
			}
		users.append(user)
	if not users:
		return {"ok": False, "error": "Not found the global user."}
	global_user = users[0]

	result = {"ok": True, "global_user": global_user}

	user = session.exec(select(User).where(User.username == username)).one()
	if not user:
		return result

	online_status = session.exec(
		select(OnlineStatus).where(OnlineStatus.user_id == user.id)
	).one()
	if online_status:
		user = {
			"id": user.id,
			"username": user.username,
			"email": user.email,
			"first_name": user.first_name,
			"last_name": user.last_name,
			"is_online": online_status.is_online,
		}
	else:
		user = {
			"id": user.id,
			"username": user.username,
			"email": user.email,
			"first_name": user.first_name,
			"last_name": user.last_name,
			"is_online": False,
		}

	result["local_user"] = user
	return result


@router.put("/api/v2/user/")
async def put_user(session: SessionDep, request: Request):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	body = await request.body()
	body: dict = json.loads(body)

	user = session.exec(select(User).where(User.id == body["id"])).one()
	if not user:
		return {"ok": False, "error": "Not found user."}

	if user.id != request.state.user.id:
		return {"ok": False, "error": "Access denied."}

	user.first_name = body["first_name"]
	user.last_name = body["last_name"]
	user.email = body["email"]

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

	user = session.exec(select(User).where(User.username == username)).one()
	if not user:
		return {"ok": False, "error": "Not found user."}

	if user.id != request.state.user.id:
		return {"ok": False, "error": "Access denied."}

	session.exec(delete(Subscriber).where(Subscriber.user_id == user.id))
	session.exec(delete(Subscriber).where(Subscriber.subscribe_id == user.id))
	session.exec(delete(Token).where(Token.user_id == user.id))
	session.exec(delete(Post).where(Post.user_id == user.id))
	session.exec(delete(OnlineStatus).where(OnlineStatus.user_id == user.id))
	session.exec(delete(Message).where(Message.sender_id == user.id))
	session.exec(delete(User).where(User.id == user.id))
	session.commit()

	return {"ok": True}
