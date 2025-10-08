from fastapi.testclient import TestClient
from sqlmodel.ext.asyncio.session import AsyncSession

from app.tests.fixtures import (
	test_engine_fixture,
	session_fixture,
	client_fixture,
)
from app.tests.modules import (
	get_or_create_default_user,
)


async def test_post_timezone(session: AsyncSession, client: TestClient):
	user, token = await get_or_create_default_user(session=session)

	response = client.post(
		"/api/v2/timezone/",
		headers={"Authorization": f"Bearer {token.key}"},
	)
	assert response.status_code == 422

	body = {
		"timezone": "UTC",
	}
	response = client.post(
		"/api/v2/timezone/",
		json=body,
		headers={"Authorization": f"Bearer {token.key}"},
	)
	assert response.status_code == 200

	data = response.json()

	assert data["ok"] == True
