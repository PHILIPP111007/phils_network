import json
from datetime import datetime
from typing import Callable

from fastapi import FastAPI, Request
from sqlmodel import Session, delete, select

from app.constants import DATETIME_FORMAT, POSTS_TO_LOAD
from app.database import SessionDep, engine
from app.enums import DeleteOption, FilterOption, SubscriberStatus
from app.models import Blog, OnlineStatus, Subscriber, Token, User
from app.modules import get_subscribers_sets

app = FastAPI(
    title="phils_network",
    version="0.1.0",
)


#########################################
# Middleware ############################
#########################################


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


###########################################
# OnlineStatus ############################
###########################################


@app.post("/api/v2/online_status/")
async def post_online_status(session: SessionDep, request: Request) -> dict[str, bool]:
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    online_statuses = session.exec(
        select(OnlineStatus).where(OnlineStatus.user_id == request.state.user.id)
    ).all()

    if not online_statuses:
        online_status = OnlineStatus(is_online=False, user_id=request.state.user.id)
        session.add(online_status)
        session.commit()

    return {"ok": True}


###################################
# Blog ############################
###################################


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
        return {"ok": False, "error": "Can not authenticate."}

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
                    "id": post.user.id,
                    "username": post.user.username,
                    "email": post.user.email,
                    "first_name": post.user.first_name,
                    "last_name": post.user.last_name,
                },
            }
        )
    return {"ok": True, "posts": posts}


@app.put("/api/v2/blog/{id}")
async def put_blog(session: SessionDep, request: Request, id: int):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    posts = session.exec(select(Blog).where(Blog.id == id)).unique().all()
    post = posts[0]

    if post.user_id != request.state.user.id:
        return {"ok": False, "error": "Access denied."}

    body = await request.body()
    body: dict = json.loads(body)
    post.content = body["content"]
    post.changed = True

    session.add(post)
    session.commit()

    return {"ok": True, "post": post}


@app.post("/api/v2/blog/")
async def post_blog(session: SessionDep, request: Request):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    body = await request.body()
    body: dict = json.loads(body)

    post = Blog(
        user_id=body["user"],
        content=body["content"],
        timestamp=datetime.now(),
        changed=False,
    )

    if post.user_id != request.state.user.id:
        return {"ok": False, "error": "Access denied."}

    session.add(post)
    session.commit()
    session.refresh(post)

    return {"ok": True, "post": post}


@app.delete("/api/v2/blog/{id}")
async def delete_blog(
    session: SessionDep, request: Request, id: int
) -> dict[str, bool]:
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    posts = session.exec(select(Blog).where(Blog.id == id)).unique().all()
    post = posts[0]

    if post.user_id != request.state.user.id:
        return {"ok": False, "error": "Access denied."}

    session.exec(delete(Blog).where(Blog.id == post.id))
    session.commit()

    return {"ok": True}


###################################
# News ############################
###################################


@app.get("/api/v2/news/{loaded_posts}/")
async def get_news(session: SessionDep, request: Request, loaded_posts: int):
    async def _get_friends(id: int):
        set_1, set_2 = await get_subscribers_sets(session=session, id=id)

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
        return {"ok": False, "error": "Can not authenticate."}

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
                    "id": post.user.id,
                    "username": post.user.username,
                    "email": post.user.email,
                    "first_name": post.user.first_name,
                    "last_name": post.user.last_name,
                },
            }
        )

    return {"ok": True, "posts": posts}


#########################################
# Subscriber ############################
#########################################


@app.get("/api/v2/subscriber/{id}/")
async def get_subscriber(
    session: SessionDep, request: Request, id: int
) -> dict[str, int]:
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

    user_1 = await _filter(user_id=request.state.user.id, subscribe_id=id)
    user_2 = await _filter(user_id=id, subscribe_id=request.state.user.id)

    # If we are friends, I can see his blog.
    if user_1 and user_2:
        status = SubscriberStatus.IS_FRIEND.value
    elif user_1:
        status = SubscriberStatus.ME_SUBSCRIBER.value
    elif user_2:
        status = SubscriberStatus.HE_SUBSCRIBER.value
    else:
        status = SubscriberStatus.NO_DATA.value

    return {"ok": True, "status": status}


@app.post("/api/v2/subscriber/{id}/")
async def post_subscriber(
    session: SessionDep, request: Request, id: int
) -> dict[str, bool]:
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    subscribe = Subscriber(user_id=request.state.user.id, subscribe_id=id)
    session.add(subscribe)
    session.commit()

    return {"ok": True}


@app.delete("/api/v2/subscriber/{id}/")
async def delete_subscriber(
    session: SessionDep, request: Request, id: int
) -> dict[str, bool]:
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    body = await request.body()
    body: dict = json.loads(body)

    if not body.get("option"):
        return {"ok": False, "error": "Not provided an option."}

    option = body["option"]

    subscribe = None
    if option == DeleteOption.DELETE_FRIEND.value:
        subscribe = (
            session.exec(
                select(Subscriber).where(
                    Subscriber.user_id == request.state.user.id,
                    Subscriber.subscribe_id == id,
                )
            )
            .unique()
            .all()
        )
        if not subscribe:
            return {"ok": False, "error": "Not found subscriber."}
        subscribe = subscribe[0]
    elif option == DeleteOption.DELETE_SUBSCRIBER.value:
        subscribe = (
            session.exec(
                select(Subscriber).where(
                    Subscriber.user_id == id,
                    Subscriber.subscribe_id == request.state.user.id,
                )
            )
            .unique()
            .all()
        )
        if not subscribe:
            return {"ok": False, "error": "Not found subscriber."}
        subscribe = subscribe[0]

    session.exec(delete(Subscriber).where(Subscriber.id == subscribe.id))
    session.commit()

    return {"ok": True}


#######################################
# FindUser ############################
#######################################


@app.post("/api/v2/find_user/")
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

        if not (first_name or last_name):
            return {"ok": False}

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

    if not find_users:
        return {"ok": False, "error": "Not found users."}

    users = []
    for find_user in find_users:
        is_online = (
            session.exec(
                select(OnlineStatus).where(OnlineStatus.user_id == find_user.id)
            )
            .unique()
            .all()
        )
        if is_online:
            is_online = is_online[0]
        else:
            is_online = False

        user = {
            "id": find_user.id,
            "username": find_user.username,
            "email": user.email,
            "first_name": find_user.first_name,
            "last_name": find_user.last_name,
            "is_online": is_online,
        }
        users.append(user)

    return {"ok": True, "users": users}


######################################
# Friends ############################
######################################


@app.get("/api/v2/friends/{option}/")
async def get_friends(session: SessionDep, request: Request, option: int):
    async def _get_friends(id: int) -> list[User]:
        set_1, set_2 = await get_subscribers_sets(session=session, id=id)

        set_3 = set()
        for id in set_1:
            if id in set_2:
                set_3.add(id)

        for id in set_2:
            if id in set_1:
                set_3.add(id)

        query = session.exec(select(User).where(User.id.in_(set_3))).unique().all()
        return query

    async def _get_subscriptions(id: int) -> list[User]:
        set_1, set_2 = await get_subscribers_sets(session=session, id=id)

        set_3 = set()
        for id in set_1:
            if id not in set_2:
                set_3.add(id)

        query = session.exec(select(User).where(User.id.in_(set_3))).unique().all()
        return query

    async def _get_subscribers(id: int) -> list[User]:
        set_1, set_2 = await get_subscribers_sets(session=session, id=id)

        set_3 = set()
        for id in set_2:
            if id not in set_1:
                set_3.add(id)

        query = session.exec(select(User).where(User.id.in_(set_3))).unique().all()
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

    users = []
    if option_func:
        query = await option_func()
        if option != FilterOption.SUBSCRIBERS_COUNT.value:
            for user in query:
                online_statuses = (
                    session.exec(
                        select(OnlineStatus).where(OnlineStatus.user_id == user.id)
                    )
                    .unique()
                    .all()
                )
                if online_statuses:
                    online_status = online_statuses[0]
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
            return {"ok": True, "query": users}
        else:
            query = len(query)
            return {"ok": True, "query": query}
    return {"ok": False, "error": "Not found users."}


###################################
# User ############################
###################################


@app.get("/api/v2/user/{username}/")
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
        online_statuses = (
            session.exec(select(OnlineStatus).where(OnlineStatus.user_id == user.id))
            .unique()
            .all()
        )
        if online_statuses:
            online_status = online_statuses[0]
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

    query = session.exec(select(User).where(User.username == username)).unique().all()
    for user in query:
        online_statuses = (
            session.exec(select(OnlineStatus).where(OnlineStatus.user_id == user.id))
            .unique()
            .all()
        )
        if online_statuses:
            online_status = online_statuses[0]
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
    if users:
        local_user = users[0]
        result["local_user"] = local_user

    return result


@app.put("/api/v2/user/{username}/")
async def put_user(session: SessionDep, request: Request, username: str):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    body = await request.body()
    body: dict = json.loads(body)

    print(body)

    users = session.exec(select(User).where(User.id == body["id"])).unique().all()
    user: User = users[0]

    if user.id != request.state.user.id:
        return {"ok": False, "error": "Access denied."}

    user.first_name = body["first_name"]
    user.last_name = body["last_name"]
    user.email = body["email"]

    session.add(user)
    session.commit()
    session.refresh(user)

    return {"ok": True, "user": user}


@app.delete("/api/v2/user/{username}/")
async def delete_user(session: SessionDep, request: Request, username: str):
    if not request.state.user:
        return {"ok": False, "error": "Can not authenticate."}

    users = session.exec(select(User).where(User.username == username)).unique().all()
    if not users:
        return {"ok": False, "error": "Not found user."}

    user: User = users[0]

    if user.id != request.state.user.id:
        return {"ok": False, "error": "Access denied."}

    session.exec(delete(Subscriber).where(Subscriber.user_id == user.id))
    session.exec(delete(Subscriber).where(Subscriber.subscribe_id == user.id))
    session.exec(delete(Token).where(Token.user_id == user.id))
    session.exec(delete(Blog).where(Blog.user_id == user.id))
    session.exec(delete(OnlineStatus).where(OnlineStatus.user_id == user.id))
    session.exec(delete(User).where(User.id == user.id))
    session.commit()

    return {"ok": True}
