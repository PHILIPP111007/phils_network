from datetime import datetime

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import User, Token


DEFAULT_USER_USERNAME = "admin"
DEFAULT_USER_EMAIL = "admin@example.com"
DEFAULT_USER_FIRST_NAME = "Admin"
DEFAULT_USER_LAST_NAME = "Admin"

DEFAULT_USER_TOKEN_KEY = "1"


async def get_or_create_default_user(session: AsyncSession):
	result = await session.exec(
		select(User).where(User.username == DEFAULT_USER_USERNAME)
	)
	user = result.first()

	if user:
		# Если пользователь существует, найдем его токен
		token_result = await session.exec(select(Token).where(Token.user_id == user.id))
		token = token_result.first()
		return user, token

	user = User(
		username=DEFAULT_USER_USERNAME,
		email=DEFAULT_USER_EMAIL,
		first_name=DEFAULT_USER_FIRST_NAME,
		last_name=DEFAULT_USER_LAST_NAME,
		is_online=False,
		user_timezone="UTC",
		image="",
		ethereum_address="",
		infura_api_key="",
	)
	session.add(user)
	await session.commit()
	await session.refresh(user)

	token = Token(key=DEFAULT_USER_TOKEN_KEY, user_id=user.id, created=datetime.now())
	session.add(token)
	await session.commit()
	await session.refresh(token)

	await session.refresh(user)

	return user, token


async def get_or_create_user(session: AsyncSession, username: str, token_key: str):
	result = await session.exec(select(User).where(User.username == username))
	user = result.first()

	if user:
		# Если пользователь существует, найдем его токен
		token_result = await session.exec(select(Token).where(Token.user_id == user.id))
		token = token_result.first()
		return user, token

	user = User(
		username=username,
		email=DEFAULT_USER_EMAIL,
		first_name=DEFAULT_USER_FIRST_NAME,
		last_name=DEFAULT_USER_LAST_NAME,
		is_online=False,
		user_timezone="UTC",
		image="",
		ethereum_address="",
		infura_api_key="",
	)
	session.add(user)
	await session.commit()
	await session.refresh(user)

	token = Token(key=token_key, user_id=user.id, created=datetime.now())
	session.add(token)
	await session.commit()
	await session.refresh(token)

	await session.refresh(user)

	return user, token
