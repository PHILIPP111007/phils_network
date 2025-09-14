from fastapi import FastAPI, Request
from sqlmodel import Session, select

from app.database import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models import Token, User
from app.views import (
	chat,
	find_user,
	friend,
	message,
	message_viewed,
	news,
	online_status,
	post,
	room,
	subscriber,
	user,
	websocket_chat,
	websocket_delete_messsage,
	websocket_online_status,
	w3,
)

app = FastAPI(
	title="phils_network",
	version="1.1.0",
	description="### Minimalistic social network written using Django, FastAPI and React.",
	contact={
		"name": "Roshchin Philipp",
		"url": "https://github.com/PHILIPP111007",
		"email": "r.phil@yandex.ru",
	},
	license_info={
		"name": "MIT",
		"identifier": "MIT",
	},
	openapi_url="/docs/openapi.json",
)

app.openapi_version = "3.0.0"


#########################################
# Middleware ############################
#########################################


@app.middleware("http")
async def middleware_add_user_to_request(request: Request, call_next):
	"Middleware to store user in request context"

	token = request.headers.get("Authorization")
	if token:
		token = token.split(" ")[1]  # Remove "Bearer"
		async with AsyncSession(engine) as session:
			token = await session.exec(select(Token).where(Token.key == token))
			token = token.first()
			if token:
				user = await session.exec(select(User).where(User.id == token.user_id))
				user = user.one()
				if user:
					request.state.user = User(
						id=user.id,
						username=user.username,
						ethereum_address=user.ethereum_address,
						infura_api_key=user.infura_api_key,
					)
					response = await call_next(request)
					return response
	request.state.user = None
	response = await call_next(request)
	return response


app.include_router(online_status.router)
app.include_router(post.router)
app.include_router(news.router)
app.include_router(subscriber.router)
app.include_router(find_user.router)
app.include_router(friend.router)
app.include_router(room.router)
app.include_router(user.router)
app.include_router(chat.router)
app.include_router(message.router)
app.include_router(message_viewed.router)
app.include_router(websocket_chat.router)
app.include_router(websocket_online_status.router)
app.include_router(websocket_delete_messsage.router)
app.include_router(w3.router)
