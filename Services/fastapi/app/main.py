import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta
from typing import Callable, Optional

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.constants import API_PREFIX, DEVELOPMENT, FASTAPI_SESSION_KEY, SECRET_KEY
from app.database import engine
from app.models import Token, User
from app.modules.session_token import verify_session_token
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
	session,
	subscriber,
	timezone,
	user,
	w3,
	websocket_chat,
	websocket_delete_messsage,
	websocket_online_status,
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

if DEVELOPMENT == "1":
	origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
else:
	# TODO: add
	origins = ["https://ваш-домен.com"]


app.add_middleware(
	CORSMiddleware,
	allow_origins=origins,
	allow_credentials=True,  # Allow cookies to be included in cross-origin requests
	allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
	allow_headers=["*"],  # Allow all headers in cross-origin requests
)


@app.middleware("http")
async def attach_user_to_request(request: Request, call_next: Callable):
	"""Middleware to store user in request context"""

	# Извлекаем учетные данные из запроса
	token = request.headers.get("Authorization")
	session_token = request.cookies.get(FASTAPI_SESSION_KEY)
	global_user_username = request.query_params.get("global_user_username")

	# Инициализируем пользователя как None по умолчанию
	request.state.user = None

	if not session_token:
		return await call_next(request)

	# Базовая валидация наличия учетных данных
	if not (token and global_user_username and " " in token):
		return await call_next(request)

	session_data = verify_session_token(session_token=session_token)
	if session_data is None:
		return await call_next(request)

	# Извлекаем токен из заголовка Authorization (формат: "Bearer <token>")
	token = token.split(" ", 1)[1]

	async with AsyncSession(engine) as session:
		token_obj = await session.exec(select(Token).where(Token.key == token))
		token_obj = token_obj.first()
		if not token_obj:
			return await call_next(request)

		session_user_id = session_data["user_id"]
		user = await session.exec(select(User).where(User.id == token_obj.user_id))
		user = user.one()
		if (
			user
			and user.username == global_user_username
			and user.id == session_user_id
		):
			request.state.user = User(
				id=user.id,
				username=user.username,
				user_timezone=user.user_timezone,
				image=user.image,
				ethereum_address=user.ethereum_address,
				infura_api_key=user.infura_api_key,
			)

	# Продолжаем обработку запроса
	return await call_next(request)


app.include_router(session.router, prefix=API_PREFIX)
app.include_router(online_status.router, prefix=API_PREFIX)
app.include_router(post.router, prefix=API_PREFIX)
app.include_router(news.router, prefix=API_PREFIX)
app.include_router(subscriber.router, prefix=API_PREFIX)
app.include_router(find_user.router, prefix=API_PREFIX)
app.include_router(friend.router, prefix=API_PREFIX)
app.include_router(room.router, prefix=API_PREFIX)
app.include_router(user.router, prefix=API_PREFIX)
app.include_router(chat.router, prefix=API_PREFIX)
app.include_router(message.router, prefix=API_PREFIX)
app.include_router(message_viewed.router, prefix=API_PREFIX)
app.include_router(websocket_chat.router, prefix=API_PREFIX)
app.include_router(websocket_online_status.router, prefix=API_PREFIX)
app.include_router(websocket_delete_messsage.router, prefix=API_PREFIX)
app.include_router(timezone.router, prefix=API_PREFIX)
app.include_router(w3.router, prefix=API_PREFIX)


if __name__ == "__main__":
	import uvicorn

	uvicorn.run(app, host="0.0.0.0", port=8080)
