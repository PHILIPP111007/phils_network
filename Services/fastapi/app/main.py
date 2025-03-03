import json

from fastapi import FastAPI, Request
from sqlmodel import Session, select

from app.constants import DATETIME_FORMAT, POSTS_TO_LOAD
from app.database import SessionDep, engine
from app.enums import SubscriberStatus
from app.models import Blog, OnlineStatus, Subscriber, Token, User

app = FastAPI(
    title="phils_network",
    version="0.1.0",
)


# Middleware to store user in request context
@app.middleware("http")
async def add_user_to_request(request: Request, call_next):
    token = request.headers.get("Authorization")
    if token:
        token = token.split(" ")[1]  # Remove "Bearer"
        with Session(engine) as session:
            tokens = (
                session.exec(select(Token).where(Token.key == token)).unique().all()
            )
            if tokens:
                token = tokens[0]
                users = (
                    session.exec(select(User).where(User.id == token.user_id))
                    .unique()
                    .all()
                )
                if users:
                    user = users[0]
                    if user:
                        request.state.user = User(id=user.id, username=user.username)
                        response = await call_next(request)
                        return response
    request.state.user = None
    response = await call_next(request)
    return response


# OnlineStatus


@app.post("/api/v2/online_status/")
async def post_online_status(session: SessionDep, request: Request):
    if not request.state.user:
        return {"ok": False, "error": "can not authenticate"}

    online_statuses = session.exec(
        select(OnlineStatus).where(OnlineStatus.user_id == request.state.user.id)
    ).all()

    if not online_statuses:
        online_status = OnlineStatus(is_online=False, user_id=request.state.user.id)
        session.add(online_status)
        session.commit()

    return {"ok": True}


# Blog


@app.get("/api/v2/blog/{username}/{loaded_posts}/")
async def get_blog(
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
        return {"ok": False, "error": "can not authenticate"}

    users = session.exec(select(User).where(User.username == username)).unique().all()

    if not users:
        return {"ok": False, "error": "Not found user."}

    unknown = users[0]

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
            select(Blog)
            .where(Blog.user_id == unknown.id)
            .offset(loaded_posts)
            .limit(POSTS_TO_LOAD)
            .order_by(Blog.timestamp.desc())
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
                    "username": post.user.username,
                    "first_name": post.user.first_name,
                    "last_name": post.user.last_name,
                },
            }
        )
    return {"ok": True, "posts": posts}


@app.put("/api/v2/blog/{id}")
async def put_blog(session: SessionDep, request: Request, id: int):
    if not request.state.user:
        return {"ok": False, "error": "can not authenticate"}

    posts = session.exec(select(Blog).where(Blog.id == id)).unique().all()
    post = posts[0]

    body = await request.body()
    post.content = json.loads(body)["content"]
    post.changed = True

    session.add(post)
    session.commit()

    return {"ok": True, "post": post}


# News


@app.get("/api/v2/news/{loaded_posts}")
async def get_news(session: SessionDep, request: Request, loaded_posts: int):
    async def _get_friends(id):
        set_1 = (
            session.exec(
                select(Subscriber.subscribe_id).where(Subscriber.user_id == id)
            )
            .unique()
            .all()
        )
        set_2 = (
            session.exec(
                select(Subscriber.user_id).where(Subscriber.subscribe_id == id)
            )
            .unique()
            .all()
        )

        set_3 = set()
        for id in set_1:
            if id in set_2:
                set_3.add(id)

        for id in set_2:
            if id in set_1:
                set_3.add(id)

        query = session.exec(select(User).where(User.id.in_(set_3))).unique().all()
        query = [user.id for user in query]
        return query

    if not request.state.user:
        return {"ok": False, "error": "can not authenticate"}

    friends = await _get_friends(id=request.state.user.id)

    query = (
        session.exec(
            select(Blog)
            .where(Blog.user_id.in_(friends))
            .offset(loaded_posts)
            .limit(POSTS_TO_LOAD)
            .order_by(Blog.timestamp.desc())
        )
        .unique()
        .all()
    )

    if not query:
        return {"ok": False, "error": "Not found posts."}

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
                    "username": post.user.username,
                    "first_name": post.user.first_name,
                    "last_name": post.user.last_name,
                },
            }
        )

    return {"ok": True, "posts": posts}
