from typing import Callable

from fastapi import APIRouter, Request
from sqlmodel import select

from app.database import SessionDep
from app.enums import FilterOption
from app.models import User
from app.modules import get_subscribers_sets, get_file_content
from app.constants import USER_IMAGE_PATH

router = APIRouter(tags=["friend"])


@router.get("/friends/{option}/")
async def get_friends(session: SessionDep, request: Request, option: FilterOption):
	async def _get_friends(id: int) -> list[User]:
		set_1, set_2 = await get_subscribers_sets(session=session, id=id)

		set_3 = set()
		for id in set_1:
			if id in set_2:
				set_3.add(id)

		query = await session.exec(select(User).where(User.id.in_(set_3)))
		query = query.unique().all()
		return query

	async def _get_subscriptions(id: int) -> list[User]:
		set_1, set_2 = await get_subscribers_sets(session=session, id=id)

		set_3 = set()
		for id in set_1:
			if id not in set_2:
				set_3.add(id)

		query = await session.exec(select(User).where(User.id.in_(set_3)))
		query = query.unique().all()
		return query

	async def _get_subscribers(id: int) -> list[User]:
		set_1, set_2 = await get_subscribers_sets(session=session, id=id)

		set_3 = set()
		for id in set_2:
			if id not in set_1:
				set_3.add(id)

		query = await session.exec(select(User).where(User.id.in_(set_3)))
		query = query.unique().all()
		return query

	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	options = {
		FilterOption.FRIENDS.value: lambda: _get_friends(id=request.state.user.id),
		FilterOption.SUBSCRIPTIONS.value: lambda: _get_subscriptions(
			id=request.state.user.id
		),
		FilterOption.SUBSCRIBERS.value: lambda: _get_subscribers(
			id=request.state.user.id
		),
		FilterOption.SUBSCRIBERS_COUNT.value: lambda: _get_subscribers(
			id=request.state.user.id
		),
	}

	option_func: Callable[[int], list[User] | int] | None = options.get(option, None)

	if not option_func:
		return {"ok": False, "error": "Not found users."}

	users: list[dict] = []
	query = await option_func()
	if option != FilterOption.SUBSCRIBERS_COUNT.value:
		for user in query:
			image_path = USER_IMAGE_PATH.format(user.id)

			user = {
				"id": user.id,
				"username": user.username,
				"email": user.email,
				"first_name": user.first_name,
				"last_name": user.last_name,
				"is_online": user.is_online,
				"image": await get_file_content(file_name=image_path),
			}
			users.append(user)
		return {"ok": True, "query": users}
	else:
		query = len(query)
		return {"ok": True, "query": query}
