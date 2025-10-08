import pytest
from fastapi.testclient import TestClient
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import User, Token
from app.tests.database import (
	test_engine_fixture,
	session_fixture,
	client_fixture,
)
from app.tests.modules import (
	get_or_create_default_user,
	get_or_create_user,
	DEFAULT_USER_TOKEN_KEY,
)


@pytest.mark.asyncio
async def test_get_user(session: AsyncSession, client: TestClient):
	user, token = await get_or_create_default_user(session=session)

	response = client.get(
		f"/api/v2/user/{user.username}/",
		headers={"Authorization": f"Bearer {token.key}"},
	)
	assert response.status_code == 200
	data = response.json()

	assert token.key == DEFAULT_USER_TOKEN_KEY
	assert data["ok"] == True
	assert data["global_user"]["username"] == user.username
	assert data["local_user"]["username"] == user.username


@pytest.mark.asyncio
async def test_get_user_test_user(session: AsyncSession, client: TestClient):
	user, token = await get_or_create_default_user(session=session)

	await session.refresh(token)
	user_token_key = token.key

	test_user_token_key = "2"
	test_user, test_user_token = await get_or_create_user(
		session=session, username="test_user", token_key=test_user_token_key
	)

	await session.refresh(test_user)

	response = client.get(
		f"/api/v2/user/{test_user.username}/",
		headers={"Authorization": f"Bearer {user_token_key}"},
	)
	assert response.status_code == 200
	data = response.json()

	assert data["ok"] == True

	await session.refresh(user)
	assert data["global_user"]["username"] == user.username

	await session.refresh(test_user)
	assert data["local_user"]["username"] == test_user.username
