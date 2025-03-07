from datetime import datetime

from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlmodel import delete, select

from app.constants import DATETIME_FORMAT, POSTS_TO_LOAD
from app.database import SessionDep
from app.enums import SubscriberStatus
from app.models import Post, Subscriber, User

router = APIRouter(tags=["post"])


class Content(BaseModel):
	content: str


class UserAndContent(BaseModel):
	user: int
	content: str


@router.get("/api/v2/blog/{username}/{loaded_posts}/")
async def get_post(
	session: SessionDep, request: Request, username: str, loaded_posts: int
):
	async def _filter(user_id: int, subscribe_id: int) -> list[Subscriber]:
		return (
			session.exec(
				select(Subscriber).where(
					Subscriber.user_id == user_id,
					Subscriber.subscribe_id == subscribe_id,
				)
			)
			.unique()
			.all()
		)

	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	unknown = session.exec(select(User).where(User.username == username)).first()
	if not unknown:
		return {"ok": False, "error": "Not found user."}

	if request.state.user.id != unknown.id:
		user_1 = await _filter(user_id=request.state.user.id, subscribe_id=unknown.id)
		user_2 = await _filter(user_id=unknown.id, subscribe_id=request.state.user.id)

		# If we are friends, I can see his blog.
		if user_1 and user_2:
			data = SubscriberStatus.IS_FRIEND.value
		elif user_1:
			data = SubscriberStatus.ME_SUBSCRIBER.value
		elif user_2:
			data = SubscriberStatus.HE_SUBSCRIBER.value
		else:
			data = SubscriberStatus.NO_DATA.value

		if data != SubscriberStatus.IS_FRIEND.value:
			return {"ok": False, "error": "Make friends to see his blog."}

	query = (
		session.exec(
			select(Post)
			.where(Post.user_id == unknown.id)
			.order_by(Post.timestamp.desc())
			.offset(loaded_posts)
			.limit(POSTS_TO_LOAD)
		)
		.unique()
		.all()
	)
	if not query:
		return {"ok": False, "error": "Not found user posts."}

	posts = []
	for post in query:
		posts.append(
			{
				"id": post.id,
				"timestamp": post.timestamp.strftime(DATETIME_FORMAT),
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


@router.put("/api/v2/blog/{id}/")
async def put_post(session: SessionDep, request: Request, id: int, content: Content):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	post = session.exec(select(Post).where(Post.id == id)).first()
	if not post:
		return {"ok": False, "error": "Not found post."}

	if post.user_id != request.state.user.id:
		return {"ok": False, "error": "Access denied."}

	post.content = content.content
	post.changed = True

	session.add(post)
	session.commit()

	return {"ok": True, "post": post}


@router.post("/api/v2/blog/")
async def post_post(
	session: SessionDep, request: Request, user_and_content: UserAndContent
):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	post = Post(
		user_id=user_and_content.user,
		content=user_and_content.content,
		timestamp=datetime.now(),
		changed=False,
	)

	if post.user_id != request.state.user.id:
		return {"ok": False, "error": "Access denied."}

	session.add(post)
	session.commit()
	session.refresh(post)

	return {"ok": True, "post": post}


@router.delete("/api/v2/blog/{id}/")
async def delete_post(
	session: SessionDep, request: Request, id: int
) -> dict[str, bool]:
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	post = session.exec(select(Post).where(Post.id == id)).first()
	if not post:
		return {"ok": False, "error": "Not found post."}

	if post.user_id != request.state.user.id:
		return {"ok": False, "error": "Access denied."}

	session.exec(delete(Post).where(Post.id == post.id))
	session.commit()

	return {"ok": True}
