from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlmodel import select

from app.database import SessionDep
from app.models import OnlineStatus, User

router = APIRouter(tags=["find_user"])


class FindUser(BaseModel):
	username: str | None = None
	first_name: str | None = None
	last_name: str | None = None


@router.post("/api/v2/find_user/")
async def post_find_user(session: SessionDep, request: Request, find_user: FindUser):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	find_users = None
	if find_user.username:
		find_users = (
			session.exec(
				select(User).where(
					User.id != request.state.user.id,
					User.username.contains(find_user.username),
				)
			)
			.unique()
			.all()
		)
	else:
		if find_user.first_name:
			query_1 = (
				session.exec(
					select(User).where(
						User.first_name.contains(find_user.first_name),
						User.id != request.state.user.id,
					)
				)
				.unique()
				.all()
			)

		if find_user.last_name:
			query_2 = (
				session.exec(
					select(User).where(
						User.last_name.contains(find_user.last_name),
						User.id != request.state.user.id,
					)
				)
				.unique()
				.all()
			)

		if find_user.first_name and find_user.last_name:
			find_users = []
			for user in query_1:
				find_users.append(user)
			for user in query_2:
				find_users.append(user)
		elif find_user.first_name:
			find_users = query_1
		elif find_user.last_name:
			find_users = query_2
		else:
			find_users = None

	if not find_users:
		return {"ok": False, "error": "Not found users."}

	users = []
	for find_user in find_users:
		is_onlines = (
			session.exec(
				select(OnlineStatus).where(OnlineStatus.user_id == find_user.id)
			)
			.unique()
			.all()
		)
		if not is_onlines:
			is_online = False
		else:
			is_online = is_onlines

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
