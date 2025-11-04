from fastapi import APIRouter, Request
from sqlmodel import select

from app.constants import USER_IMAGE_PATH
from app.database import SessionDep
from app.models import User
from app.modules import get_image_file_content
from app.request_body import FindUser

router = APIRouter(tags=["find_user"])


@router.post("/find_user/")
async def post_find_user(session: SessionDep, request: Request, find_user: FindUser):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	find_users = None
	if find_user.username:
		find_users = await session.exec(
			select(User).where(
				User.id != request.state.user.id,
				User.username.contains(find_user.username),
			)
		)
		find_users = find_users.unique().all()
	else:
		if find_user.first_name:
			query_1 = await session.exec(
				select(User).where(
					User.id != request.state.user.id,
					User.first_name.contains(find_user.first_name),
				)
			)
			query_1 = query_1.unique().all()

		if find_user.last_name:
			query_2 = session.exec(
				select(User).where(
					User.id != request.state.user.id,
					User.last_name.contains(find_user.last_name),
				)
			)
			query_2 = query_2.unique().all()

		if find_user.first_name and find_user.last_name:
			find_users: list[User] = []
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
	for user in find_users:
		image_path = USER_IMAGE_PATH.format(user.id)

		user = {
			"id": user.id,
			"username": user.username,
			"email": user.email,
			"first_name": user.first_name,
			"last_name": user.last_name,
			"is_online": user.is_online,
			"image": await get_image_file_content(file_name=image_path, size=30),
		}
		users.append(user)

	return {"ok": True, "users": users}
