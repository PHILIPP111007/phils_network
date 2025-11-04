from typing import Callable

from fastapi import APIRouter, Request
from sqlmodel import select

from app.constants import USER_IMAGE_PATH
from app.database import SessionDep
from app.enums import FilterOption
from app.models import User
from app.modules import get_image_file_content, get_subscribers_sets

router = APIRouter(tags=["friend"])


@router.get("/friends/{option}/")
async def get_friends(session: SessionDep, request: Request, option: FilterOption):
	async def _get_friends(id: int) -> list[User]:
		subscriptions, subscribers = await get_subscribers_sets(session=session, id=id)

		friend_ids = subscriptions & subscribers

		query = await session.exec(select(User).where(User.id.in_(friend_ids)))
		query = query.unique().all()
		return query

	async def _get_subscriptions(id: int) -> list[User]:
		subscriptions, subscribers = await get_subscribers_sets(session=session, id=id)

		subscription_ids = subscriptions - subscribers

		query = await session.exec(select(User).where(User.id.in_(subscription_ids)))
		query = query.unique().all()
		return query

	async def _get_subscribers(id: int) -> list[User]:
		subscriptions, subscribers = await get_subscribers_sets(session=session, id=id)

		subscriber_ids = subscribers - subscriptions

		query = await session.exec(select(User).where(User.id.in_(subscriber_ids)))
		query = query.unique().all()
		return query

	async def _get_subscribers_count(id: int) -> list[User]:
		subscriptions, subscribers = await get_subscribers_sets(session=session, id=id)

		subscriber_ids = subscribers - subscriptions

		query = await session.exec(select(User).where(User.id.in_(subscriber_ids)))
		query = query.unique().all()
		return len(query)

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
		FilterOption.SUBSCRIBERS_COUNT.value: lambda: _get_subscribers_count(
			id=request.state.user.id
		),
	}

	option_func: Callable[[int], list[User] | int] | None = options.get(option, None)

	if not option_func:
		return {"ok": False, "error": "Not found users."}

	query = await option_func()
	if option != FilterOption.SUBSCRIBERS_COUNT.value:
		users: list[dict] = []
		for user in query:
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
		return {"ok": True, "query": users}
	else:
		return {"ok": True, "query": query}
