import json
from datetime import datetime
from typing import Callable

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from sqlmodel import Session, delete, select

from app.constants import DATETIME_FORMAT, MESSAGES_TO_LOAD, POSTS_TO_LOAD
from app.database import SessionDep, engine
from app.enums import DeleteOption, FilterOption, SubscriberStatus
from app.models import (
	Message,
	OnlineStatus,
	Post,
	Room,
	RoomCreator,
	RoomInvitation,
	RoomSubscribers,
	Subscriber,
	Token,
	User,
)
from app.modules import get_subscribers_sets

app = FastAPI(
	title="phils_network",
	version="3.0.0",
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
				user = session.exec(select(User).where(User.id == token.user_id)).one()
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


@app.delete("/api/v2/online_status/")
async def delete_online_status(session: SessionDep, request: Request):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	session.exec(
		delete(OnlineStatus).where(OnlineStatus.user_id == request.state.user.id)
	)
	session.commit()

	return {"ok": True}


###################################
# Post ############################
###################################


@app.get("/api/v2/blog/{username}/{loaded_posts}/")
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

	unknown = session.exec(select(User).where(User.username == username)).one()
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
			.offset(loaded_posts)
			.limit(POSTS_TO_LOAD)
			.order_by(Post.timestamp.desc())
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
async def put_post(session: SessionDep, request: Request, id: int):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	post = session.exec(select(Post).where(Post.id == id)).one()
	if not post:
		return {"ok": False, "error": "Not found post."}

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
async def post_post(session: SessionDep, request: Request):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	body = await request.body()
	body: dict = json.loads(body)

	post = Post(
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
async def delete_post(
	session: SessionDep, request: Request, id: int
) -> dict[str, bool]:
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	post = session.exec(select(Post).where(Post.id == id)).one()
	if not post:
		return {"ok": False, "error": "Not found post."}

	if post.user_id != request.state.user.id:
		return {"ok": False, "error": "Access denied."}

	session.exec(delete(Post).where(Post.id == post.id))
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

		query = session.exec(select(User.id).where(User.id.in_(set_3))).unique().all()
		return query

	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	friends = await _get_friends(id=request.state.user.id)

	query = (
		session.exec(
			select(Post)
			.where(Post.user_id.in_(friends))
			.offset(loaded_posts)
			.limit(POSTS_TO_LOAD)
			.order_by(Post.timestamp.desc())
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
		subscribe = session.exec(
			select(Subscriber).where(
				Subscriber.user_id == request.state.user.id,
				Subscriber.subscribe_id == id,
			)
		).one()
		if not subscribe:
			return {"ok": False, "error": "Not found subscriber."}

	elif option == DeleteOption.DELETE_SUBSCRIBER.value:
		subscribe = session.exec(
			select(Subscriber).where(
				Subscriber.user_id == id,
				Subscriber.subscribe_id == request.state.user.id,
			)
		).one()
		if not subscribe:
			return {"ok": False, "error": "Not found subscriber."}

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
		online_status = session.exec(
			select(OnlineStatus).where(OnlineStatus.user_id == user.id)
		).one()
		if online_status:
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

	user = session.exec(select(User).where(User.username == username)).one()
	if not user:
		return result

	online_status = session.exec(
		select(OnlineStatus).where(OnlineStatus.user_id == user.id)
	).one()
	if online_status:
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

	result["local_user"] = user
	return result


@app.put("/api/v2/user/")
async def put_user(session: SessionDep, request: Request):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	body = await request.body()
	body: dict = json.loads(body)

	user = session.exec(select(User).where(User.id == body["id"])).one()
	if not user:
		return {"ok": False, "error": "Not found user."}

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
async def delete_user(
	session: SessionDep, request: Request, username: str
) -> dict[str, bool]:
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	user = session.exec(select(User).where(User.username == username)).one()
	if not user:
		return {"ok": False, "error": "Not found user."}

	if user.id != request.state.user.id:
		return {"ok": False, "error": "Access denied."}

	session.exec(delete(Subscriber).where(Subscriber.user_id == user.id))
	session.exec(delete(Subscriber).where(Subscriber.subscribe_id == user.id))
	session.exec(delete(Token).where(Token.user_id == user.id))
	session.exec(delete(Post).where(Post.user_id == user.id))
	session.exec(delete(OnlineStatus).where(OnlineStatus.user_id == user.id))
	session.exec(delete(User).where(User.id == user.id))
	session.commit()

	return {"ok": True}


###################################
# Room ############################
###################################


@app.get("/api/v2/room/")
async def get_room(session: SessionDep, request: Request):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	room_ids = session.exec(
		select(RoomSubscribers.room_id).where(
			RoomSubscribers.user_id == request.state.user.id
		)
	).all()
	rooms = session.exec(select(Room).where(Room.id.in_(room_ids))).unique().all()

	time_and_rooms = []
	for room in rooms:
		messages = (
			session.exec(
				select(Message)
				.where(Message.room_id == room.id)
				.order_by(Message.timestamp.desc())
			)
			.unique()
			.all()
		)
		if messages:
			time = messages[0].timestamp
			time_and_rooms.append((time, room, messages[0]))
		else:
			time = room.timestamp
			time_and_rooms.append((time, room, None))

	time_and_rooms: list[tuple[datetime, Room, Message | None]] = sorted(
		time_and_rooms, key=lambda x: x[0], reverse=True
	)

	rooms = []
	for time, room, last_message in time_and_rooms:
		if last_message:
			last_message_sender = last_message.sender.username
			last_message_text = last_message.text
		else:
			last_message_sender = None
			last_message_text = ""

		room = {
			"id": room.id,
			"name": room.name,
			"timestamp": room.timestamp.strftime(DATETIME_FORMAT),
			"last_message_timestamp": time.strftime(DATETIME_FORMAT),
			"last_message_text": last_message_text,
			"last_message_sender": last_message_sender,
		}
		rooms.append(room)

	return {"ok": True, "rooms": rooms}


@app.post("/api/v2/room/")
async def post_room(session: SessionDep, request: Request):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	body = await request.body()
	body: dict = json.loads(body)

	room_name = body.get("name")
	if room_name is None:
		return {"ok": False, "error": "Not provided room name."}

	room = Room(name=room_name, timestamp=datetime.now())
	session.add(room)
	session.commit()
	session.refresh(room)

	room_subscriber = RoomSubscribers(user_id=request.state.user.id, room_id=room.id)
	session.add(room_subscriber)
	session.commit()

	room_creator = RoomCreator(creator_id=request.state.user.id, room_id=room.id)
	session.add(room_creator)
	session.commit()

	subscribers_id_list: list[int] | None = body.get("subscribers")
	if subscribers_id_list:
		subscribers = (
			session.exec(select(User).where(User.id.in_(subscribers_id_list)))
			.unique()
			.all()
		)
		if subscribers:
			for subscriber in subscribers:
				if subscriber.id == request.state.user.id:
					continue

				room_invitation = RoomInvitation(
					creator_id=request.state.user.id,
					room_id=room.id,
					to_user_id=subscriber.id,
					timestamp=datetime.now(),
				)
				session.add(room_invitation)
				session.commit()

	session.refresh(room)
	return {"ok": True, "room": room}


@app.get("/api/v2/invite_chats/{username}/")
async def get_room_invitation(session: SessionDep, request: Request, username: str):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	query = (
		session.exec(
			select(RoomInvitation).where(
				RoomInvitation.to_user_id == request.state.user.id
			)
		)
		.unique()
		.all()
	)

	rooms = []
	for room in query:
		room = {
			"id": room.id,
			"creator_id": room.creator_id,
			"room_id": room.room_id,
			"to_user_id": room.to_user_id,
			"timestamp": room.timestamp,
			"room": {
				"id": room.room.id,
				"name": room.room.name,
			},
			"creator": {"username": room.creator.username},
		}
		rooms.append(room)

	if not rooms:
		return {"ok": False, "error": "Not found rooms."}

	return {"ok": True, "rooms": rooms}


@app.post("/api/v2/invite_chats/{username}/add_room/{room_id}/")
async def post_room_invitation_add(
	session: SessionDep, request: Request, username: str, room_id: int
) -> dict[str, bool]:
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	room_invite = session.exec(
		select(RoomInvitation).where(RoomInvitation.id == room_id)
	).one()

	room_creator = session.exec(
		select(RoomCreator).where(RoomCreator.room_id == room_invite.room_id)
	).one()

	if room_creator:
		session.exec(delete(RoomInvitation).where(RoomInvitation.id == room_invite.id))
		room = session.exec(select(Room).where(Room.id == room_creator.room_id)).one()
		user = session.exec(select(User).where(User.username == username)).one()

		flag = (
			session.exec(
				select(RoomSubscribers).where(
					RoomSubscribers.user_id == user.id,
					RoomSubscribers.room_id == room.id,
				)
			)
			.unique()
			.all()
		)
		if not flag:
			room_subscriber = RoomSubscribers(user_id=user.id, room_id=room.id)
			session.add(room_subscriber)
			session.commit()
		else:
			session.exec(delete(RoomInvitation).where(RoomInvitation.id == room_id))
			session.commit()

	return {"ok": True}


@app.post("/api/v2/invite_chats/{username}/remove_room/{room_id}/")
async def post_room_invitation_remove(
	session: SessionDep, request: Request, username: str, room_id: int
) -> dict[str, bool]:
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	session.exec(delete(RoomInvitation).where(RoomInvitation.id == room_id))
	session.commit()

	return {"ok": True}


###################################
# Chat ############################
###################################


@app.get("/api/v2/room/{id}/")
async def get_chat(session: SessionDep, request: Request, id: int):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	room = session.exec(select(Room).where(Room.id == id)).one()
	if not room:
		return {"ok": False, "error": "Not found room."}

	room_creator = session.exec(
		select(RoomCreator).where(RoomCreator.room_id == id)
	).one()
	if not room_creator:
		return {"ok": False, "error": "Not found room creator."}

	is_creator = room_creator.creator_id == request.state.user.id

	subscribers_info = [
		{
			"id": subscriber.user.id,
			"username": subscriber.user.username,
			"first_name": subscriber.user.first_name,
			"last_name": subscriber.user.last_name,
		}
		for subscriber in room.room_subscribers
	]

	room = {
		"id": room.id,
		"name": room.name,
		"timestamp": room.timestamp.strftime(DATETIME_FORMAT),
		"subscribers_info": subscribers_info,
	}

	return {
		"ok": True,
		"isCreator": is_creator,
		"room": room,
	}


@app.put("/api/v2/room/{id}/")
async def put_chat(session: SessionDep, request: Request, id: int) -> dict[str, bool]:
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	body = await request.body()
	body: dict = json.loads(body)

	friends: list | None = body.get("friends")
	subscribers: list | None = body.get("subscribers")

	room = session.exec(select(Room).where(Room.id == id)).one()
	if not room:
		return {"ok": False, "error": "Not found room."}

	if friends:
		friends = session.exec(select(User).where(User.id.in_(friends))).unique().all()
		for friend in friends:
			room_invitation = RoomInvitation(
				creator_id=request.state.user.id,
				to_user_id=friend.id,
				room_id=room.id,
				timestamp=datetime.now(),
			)
			session.add(room_invitation)
			session.commit()

	if subscribers:
		for user_id in subscribers:
			if user_id == request.state.user.id:
				continue
			session.exec(
				delete(RoomSubscribers).where(
					RoomSubscribers.user_id == user_id,
					RoomSubscribers.room_id == room.id,
				)
			)
		session.commit()

	if not room.room_subscribers:
		session.exec(delete(Room).where(Room.id == room.id))
		session.exec(delete(Message).where(Message.room_id == room.id))
		session.exec(delete(RoomCreator).where(RoomCreator.room_id == room.id))
		session.exec(delete(RoomInvitation).where(RoomInvitation.room_id == room.id))
		session.exec(delete(RoomSubscribers).where(RoomSubscribers.room_id == room.id))
		session.commit()

	return {"ok": True}


######################################
# Message ############################
######################################


@app.get("/api/v2/room/{id}/{loaded_messages}/")
async def get_message(
	session: SessionDep, request: Request, id: int, loaded_messages: int
):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	room = session.exec(select(Room).where(Room.id == id)).one()
	if not room:
		return {"ok": False, "error": "Not found room."}

	flag = (
		session.exec(
			select(RoomSubscribers).where(
				RoomSubscribers.user_id == request.state.user.id,
				RoomSubscribers.room_id == room.id,
			)
		)
		.unique()
		.all()
	)
	if not flag:
		return {"ok": False, "error": "Access denied."}

	query = (
		session.exec(
			select(Message)
			.where(
				Message.room_id == room.id,
			)
			.offset(loaded_messages)
			.limit(MESSAGES_TO_LOAD)
			.order_by(Message.timestamp.desc())
		)
		.unique()
		.all()
	)
	if not query:
		return {"ok": False, "error": "Not found messages."}

	messages = []
	for message in query:
		message = {
			"text": message.text,
			"timestamp": message.timestamp.strftime(DATETIME_FORMAT),
			"sender": {
				"username": message.sender.username,
				"first_name": message.sender.first_name,
				"last_name": message.sender.last_name,
			},
		}
		messages.append(message)

	return {"ok": True, "messages": messages}


########################################
# WebSocket ############################
########################################


@app.websocket("/ws/online_status/{user_id}/")
async def online_status(
	session: SessionDep, websocket: WebSocket, user_id: int, token_key: str = None
):
	async def _get_user_id() -> int | None:
		nonlocal token_key

		tokens = (
			session.exec(select(Token).where(Token.key == token_key)).unique().all()
		)
		if tokens:
			token = tokens[0]
			return token.user_id
		return

	async def _create_online_status():
		nonlocal user_id

		online_statuses = (
			session.exec(select(OnlineStatus).where(OnlineStatus.user_id == user_id))
			.unique()
			.all()
		)
		if online_statuses:
			online_status = online_statuses[0]
			online_status.is_online = True
			session.add(online_status)
			session.commit()

	async def _remove_online_status() -> None:
		nonlocal user_id

		online_statuses = (
			session.exec(select(OnlineStatus).where(OnlineStatus.user_id == user_id))
			.unique()
			.all()
		)
		if online_statuses:
			online_status = online_statuses[0]
			online_status.is_online = False
			session.add(online_status)
			session.commit()

	await websocket.accept()
	id = await _get_user_id()
	try:
		while True:
			if not id:
				await websocket.close()
			else:
				await _create_online_status()

			await websocket.receive_text()

	except WebSocketDisconnect:
		await _remove_online_status()


class ConnectionManager:
	def __init__(self):
		self.active_connections: list[WebSocket] = []

	async def connect(self, websocket: WebSocket):
		await websocket.accept()
		self.active_connections.append(websocket)

	async def disconnect(self, websocket: WebSocket):
		self.active_connections.remove(websocket)


manager = ConnectionManager()


@app.websocket("/ws/chat/{room_id}/")
async def chat(
	session: SessionDep, websocket: WebSocket, room_id: int, token_key: str = None
):
	async def _get_user_id() -> int | None:
		nonlocal token_key

		tokens = (
			session.exec(select(Token).where(Token.key == token_key)).unique().all()
		)
		if tokens:
			token = tokens[0]
			return token.user_id
		return

	async def _check_permission(id: int) -> bool:
		"""Check if user is this room subscriber."""

		nonlocal room_id

		room = session.exec(select(Room).where(Room.id == room_id)).one()
		room_subscribers_ids: set[int] = set(
			[subscriber.user_id for subscriber in room.room_subscribers]
		)
		flag = id in room_subscribers_ids
		return flag

	async def _create_message(message: dict) -> Message:
		"""Create message."""

		nonlocal room_id

		message = Message(
			sender_id=message["sender_id"],
			room_id=room_id,
			text=message["text"],
			timestamp=datetime.now(),
		)
		session.add(message)
		session.commit()
		session.refresh(message)
		return message

	# await websocket.accept()
	await manager.connect(websocket)
	id = await _get_user_id()

	try:
		while True:
			if not id:
				await websocket.close()
			else:
				flag = _check_permission(id=id)
				if not flag:
					await websocket.close()

			text = await websocket.receive_text()
			text: dict = json.loads(text)
			query = await _create_message(text["message"])

			message = {
				"sender_id": query.sender_id,
				"room_id": query.room_id,
				"text": query.text,
				"timestamp": query.timestamp.strftime(DATETIME_FORMAT),
				"sender": {
					"username": query.sender.username,
					"first_name": query.sender.first_name,
					"last_name": query.sender.last_name,
				},
			}
			await websocket.send_text(
				data=json.dumps(
					{
						"status": True,
						"message": message,
					}
				)
			)
	except WebSocketDisconnect:
		manager.disconnect(websocket)
