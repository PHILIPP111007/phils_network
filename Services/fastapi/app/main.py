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
            tokens = session.exec(select(Token).where(Token.key == token)).all()
            if tokens:
                token = tokens[0]
                users = session.exec(select(User).where(User.id == token.user_id)).all()
                if users:
                    user = users[0]
                    if user:
                        request.state.user = User(id=user.id, username=user.username)
                        response = await call_next(request)
                        return response
    request.state.user = None
    response = await call_next(request)
    return response


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


@app.get("/api/v2/blog/{username}/{loaded_posts}/")
async def get_blog_user_page(
    session: SessionDep, request: Request, username: str, loaded_posts: int
):
    async def filter(user_id: int, subscribe_id: int) -> list[Subscriber]:
        return session.exec(
            select(Subscriber).where(
                Subscriber.user_id == user_id, Subscriber.subscribe_id == subscribe_id
            )
        ).all()

    if not request.state.user:
        return {"ok": False, "error": "can not authenticate"}

    users = session.exec(select(User).where(User.username == username)).all()

    if not users:
        return {"ok": False, "error": "Not found user."}

    unknown = users[0]

    if request.state.user.id != unknown.id:
        user_1 = await filter(user_id=request.state.user.id, subscribe_id=unknown.id)
        user_2 = await filter(user_id=unknown.id, subscribe_id=request.state.user.id)

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

    posts = session.exec(
        select(Blog)
        .where(Blog.user_id == unknown.id)
        .offset(loaded_posts)
        .limit(POSTS_TO_LOAD)
        .order_by(Blog.timestamp.desc())
    ).all()
    if not posts:
        return {"ok": False, "error": "Not found user posts."}

    for post in posts:
        post.timestamp = post.timestamp.strftime(DATETIME_FORMAT)
    return {"ok": True, "posts": posts}


# @app.get("/api/v2/online_status/")
# async def func(session: SessionDep, request: Request):
#     tokens = session.exec(select(OnlineStatus)).all()
#     token = tokens[0]
#     # print(token.user)
#     # print(token.subscriber)
#     return token
