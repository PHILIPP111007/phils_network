import json

from fastapi import APIRouter, Request
from sqlmodel import select

from app.database import SessionDep
from app.models import OnlineStatus, User

router = APIRouter(tags=["find_user"])


@router.post("/api/v2/find_user/")
async def post_find_user(session: SessionDep, request: Request):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	body = await request.body()
	body: dict = json.loads(body)
	username = body["username"]

	find_users = None
	if username:
		find_users = (
			session.exec(
				select(User).where(
					User.username.contains(username), User.id != request.state.user.id
				)
			)
			.unique()
			.all()
		)
	else:
		first_name: str | None = body["first_name"]
		last_name: str | None = body["last_name"]

		if first_name:
			query_1 = (
				session.exec(
					select(User).where(
						User.first_name.contains(first_name),
						User.id != request.state.user.id,
					)
				)
				.unique()
				.all()
			)

		if last_name:
			query_2 = (
				session.exec(
					select(User).where(
						User.last_name.contains(last_name),
						User.id != request.state.user.id,
					)
				)
				.unique()
				.all()
			)

		if first_name and last_name:
			find_users = []
			for user in query_1:
				find_users.append(user)
			for user in query_2:
				find_users.append(user)
		elif first_name:
			find_users = query_1
		elif last_name:
			find_users = query_2
		else:
			find_users = None

	if not find_users:
		return {"ok": False, "error": "Not found users."}

	users = []
	for find_user in find_users:
		is_online = session.exec(
			select(OnlineStatus).where(OnlineStatus.user_id == find_user.id)
		).one()
		if not is_online:
			is_online = False

		user = {
			"id": find_user.id,
			"username": find_user.username,
			"email": find_user.email,
			"first_name": find_user.first_name,
			"last_name": find_user.last_name,
			"is_online": is_online,
		}
		users.append(user)

	return {"ok": True, "users": users}
