from fastapi.testclient import TestClient
from sqlmodel.ext.asyncio.session import AsyncSession

from app.tests.fixtures import (
	client_fixture,
	session_fixture,
	test_engine_fixture,
)
from app.tests.modules import (
	DEFAULT_USER_TOKEN_KEY,
	create_upload_file,
	get_or_create_default_user,
	get_or_create_user,
)


async def test_get_user(session: AsyncSession, client: TestClient):
	user, token = await get_or_create_default_user(session=session)

	response = client.get(
		f"/api/v2/user/{user.username}/?global_user_username={user.username}",
		headers={"Authorization": f"Bearer {token.key}"},
	)
	assert response.status_code == 200
	data = response.json()

	assert token.key == DEFAULT_USER_TOKEN_KEY
	assert data["ok"] == True
	assert data["global_user"]["username"] == user.username
	assert data["local_user"]["username"] == user.username


async def test_get_user_test_user(session: AsyncSession, client: TestClient):
	user, token = await get_or_create_default_user(session=session)
	default_user_username = user.username

	await session.refresh(token)
	user_token_key = token.key

	test_user_token_key = "2"
	test_user, test_user_token = await get_or_create_user(
		session=session, username="test_user", token_key=test_user_token_key
	)

	await session.refresh(test_user)

	response = client.get(
		f"/api/v2/user/{test_user.username}/?global_user_username={default_user_username}",
		headers={"Authorization": f"Bearer {user_token_key}"},
	)
	assert response.status_code == 200
	data = response.json()

	assert data["ok"] == True

	await session.refresh(user)
	assert data["global_user"]["username"] == user.username

	await session.refresh(test_user)
	assert data["local_user"]["username"] == test_user.username


async def test_put_user(session: AsyncSession, client: TestClient):
	user, token = await get_or_create_default_user(session=session)

	body = {
		"first_name": "",
		"last_name": "",
		"email": "",
		"ethereum_address": "",
		"infura_api_key": "",
	}
	response = client.put(
		f"/api/v2/user/?global_user_username={user.username}",
		json=body,
		headers={"Authorization": f"Bearer {token.key}"},
	)
	assert response.status_code == 200

	data = response.json()
	assert data["ok"] == True

	await session.refresh(user)
	assert data["user"] == {
		"username": user.username,
		"first_name": "",
		"last_name": "",
		"email": "",
		"ethereum_address": "",
		"infura_api_key": "",
		"image": "",
		"is_online": False,
		"user_timezone": "UTC",
		"id": user.id,
	}


async def test_put_user_wrong_key(session: AsyncSession, client: TestClient):
	user, token = await get_or_create_default_user(session=session)

	body = {
		"first_name": "",
		"last_name": "",
		"email": "",
		"ethereum_address": "",
		"infura_api_key": "",
	}
	response = client.put(
		f"/api/v2/user/?global_user_username={user.username}",
		json=body,
		headers={"Authorization": "Bearer WRONG_KEY"},
	)
	assert response.status_code == 200

	data = response.json()
	assert data["ok"] == False


async def test_put_user_image(session: AsyncSession, client: TestClient):
	user, token = await get_or_create_default_user(session=session)

	upload_file = create_upload_file("test.jpg")

	form_data = {
		"image": ("test.jpg", upload_file.file, "image/jpeg"),  # Тип MIME важен!
	}

	response = client.put(
		f"/api/v2/user_image/?global_user_username={user.username}",
		files=form_data,
		headers={"Authorization": f"Bearer {token.key}"},
	)
	assert response.status_code == 200

	data = response.json()
	assert data["ok"] == True
	assert data["user"] == {
		"username": "admin",
		"email": "admin@example.com",
		"ethereum_address": "",
		"first_name": "Admin",
		"id": 1,
		"image": "",
		"infura_api_key": "",
		"is_online": False,
		"last_name": "Admin",
		"user_timezone": "UTC",
	}


async def test_delete_user(session: AsyncSession, client: TestClient):
	user, token = await get_or_create_default_user(session=session)

	await session.refresh(user)
	username = user.username
	await session.refresh(token)
	token_key = token.key

	response = client.delete(
		f"/api/v2/user/{username}/?global_user_username={username}",
		headers={"Authorization": f"Bearer {token_key}"},
	)

	assert response.status_code == 200

	data = response.json()
	assert data["ok"] == True

	response = client.delete(
		f"/api/v2/user/NON_EXISTING_USERNAME/?global_user_username={username}",
		headers={"Authorization": f"Bearer {token_key}"},
	)
	data = response.json()
	assert data["ok"] == False
	assert data["error"] == "Can not authenticate."

	user, token = await get_or_create_default_user(session=session)

	await session.refresh(user)
	username = user.username
	await session.refresh(token)
	token_key = token.key

	response = client.delete(
		f"/api/v2/user/NON_EXISTING_USERNAME/?global_user_username={username}",
		headers={"Authorization": f"Bearer {token_key}"},
	)

	assert response.status_code == 200

	data = response.json()
	assert data["ok"] == False
	assert data["error"] == "Not found user."

	test_user, test_token = await get_or_create_user(
		session=session, username="admin1", token_key="2"
	)

	response = client.delete(
		f"/api/v2/user/admin1/?global_user_username={username}",
		headers={"Authorization": f"Bearer {token_key}"},
	)

	assert response.status_code == 200

	data = response.json()
	assert data["ok"] == False
	assert data["error"] == "Access denied."
