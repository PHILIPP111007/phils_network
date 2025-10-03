from zoneinfo import ZoneInfo

from fastapi import APIRouter, Request
from sqlmodel import select
from sqlalchemy.orm import joinedload

from app.constants import DATETIME_FORMAT, POSTS_TO_LOAD
from app.database import SessionDep
from app.models import Post, User
from app.modules import get_subscribers_sets

router = APIRouter(tags=["news"])


@router.get("/api/v2/news/{loaded_posts}/")
async def get_news(session: SessionDep, request: Request, loaded_posts: int):
	async def _get_friends(id: int):
		set_1, set_2 = await get_subscribers_sets(session=session, id=id)

		set_3 = set()
		for id in set_1:
			if id in set_2:
				set_3.add(id)

		query = await session.exec(select(User.id).where(User.id.in_(set_3)))
		query = query.unique().all()
		return query

	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	friends = await _get_friends(id=request.state.user.id)

	query = await session.exec(
		select(Post)
		.where(Post.user_id.in_(friends))
		.offset(loaded_posts)
		.limit(POSTS_TO_LOAD)
		.order_by(Post.timestamp.desc())
		.options(joinedload(Post.user))
	)
	query = query.unique().all()

	if not query:
		return {"ok": False, "error": "Not found posts."}

	posts = []
	for post in query:
		if request.state.user.user_timezone:
			user_timezone = request.state.user.user_timezone
			timezone_obj = ZoneInfo(user_timezone)
			timestamp = post.timestamp.replace(tzinfo=timezone_obj)
		else:
			timestamp = post.timestamp

		posts.append(
			{
				"id": post.id,
				"timestamp": timestamp.strftime(DATETIME_FORMAT),
				"content": post.content,
				"changed": post.changed,
				"user_id": post.user_id,
				"user": {
					"id": post.user.id,
					"username": post.user.username,
					"email": post.user.email,
					"first_name": post.user.first_name,
					"last_name": post.user.last_name,
				},
			}
		)

	return {"ok": True, "posts": posts}
