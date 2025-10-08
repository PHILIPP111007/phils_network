from fastapi.testclient import TestClient
from sqlmodel import delete, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.tests.fixtures import (
	test_engine_fixture,
	session_fixture,
	client_fixture,
)
from app.tests.modules import (
	get_or_create_default_user,
	get_or_create_user,
)
from app.models import Subscriber
from app.enums import DeleteOption, SubscriberStatus


async def test_get_subscriber(session: AsyncSession, client: TestClient):
	user, token = await get_or_create_default_user(session=session)

	subscriber_id = 2

	response = client.get(
		f"/api/v2/subscriber/{subscriber_id}/",
		headers={"Authorization": f"Bearer {token.key}"},
	)
	assert response.status_code == 200
	data = response.json()

	assert data["ok"] == True
	assert data["status"] == SubscriberStatus.NO_DATA.value

	test_user, test_token = await get_or_create_user(
		session=session, username="test_user", token_key="2"
	)

	await session.refresh(user)
	await session.refresh(test_user)
	await session.refresh(token)

	response = client.get(
		f"/api/v2/subscriber/{test_user.id}/",
		headers={"Authorization": f"Bearer {token.key}"},
	)
	assert response.status_code == 200
	data = response.json()

	assert data["ok"] == True
	assert data["status"] == SubscriberStatus.NO_DATA.value

	subscribe = Subscriber(user_id=user.id, subscribe_id=test_user.id)
	session.add(subscribe)
	await session.commit()

	await session.refresh(token)
	await session.refresh(test_user)

	response = client.get(
		f"/api/v2/subscriber/{test_user.id}/",
		headers={"Authorization": f"Bearer {token.key}"},
	)
	assert response.status_code == 200
	data = response.json()

	assert data["ok"] == True
	assert data["status"] == SubscriberStatus.ME_SUBSCRIBER.value

	await session.refresh(user)

	await session.exec(
		delete(Subscriber).where(
			Subscriber.user_id == user.id, Subscriber.subscribe_id == test_user.id
		)
	)
	await session.commit()

	await session.refresh(token)
	await session.refresh(user)
	await session.refresh(test_user)

	response = client.get(
		f"/api/v2/subscriber/{test_user.id}/",
		headers={"Authorization": f"Bearer {token.key}"},
	)
	assert response.status_code == 200
	data = response.json()

	assert data["ok"] == True
	assert data["status"] == SubscriberStatus.NO_DATA.value

	subscribe = Subscriber(user_id=test_user.id, subscribe_id=user.id)
	session.add(subscribe)
	await session.commit()

	await session.refresh(token)
	await session.refresh(user)
	await session.refresh(test_user)

	response = client.get(
		f"/api/v2/subscriber/{test_user.id}/",
		headers={"Authorization": f"Bearer {token.key}"},
	)
	assert response.status_code == 200
	data = response.json()

	assert data["ok"] == True
	assert data["status"] == SubscriberStatus.HE_SUBSCRIBER.value

	await session.refresh(token)
	await session.refresh(user)
	await session.refresh(test_user)

	subscribe = Subscriber(user_id=user.id, subscribe_id=test_user.id)
	session.add(subscribe)
	await session.commit()

	await session.refresh(token)
	await session.refresh(user)
	await session.refresh(test_user)

	response = client.get(
		f"/api/v2/subscriber/{test_user.id}/",
		headers={"Authorization": f"Bearer {token.key}"},
	)
	assert response.status_code == 200
	data = response.json()

	assert data["ok"] == True
	assert data["status"] == SubscriberStatus.IS_FRIEND.value


async def test_post_subscriber(session: AsyncSession, client: TestClient):
	user, token = await get_or_create_default_user(session=session)
	test_user, test_token = await get_or_create_user(
		session=session, username="test_user", token_key="2"
	)

	await session.refresh(token)
	await session.refresh(user)
	await session.refresh(test_user)

	response = client.post(
		f"/api/v2/subscriber/{test_user.id}/",
		headers={"Authorization": f"Bearer {token.key}"},
	)
	assert response.status_code == 200
	data = response.json()

	assert data["ok"] == True

	subscribe = await session.exec(
		select(Subscriber).where(
			Subscriber.user_id == user.id,
			Subscriber.subscribe_id == test_user.id,
		)
	)

	subscribe = subscribe.unique().all()

	assert len(subscribe) == 1

	await session.refresh(token)
	await session.refresh(user)
	await session.refresh(test_user)

	subscribe = await session.exec(
		select(Subscriber).where(
			Subscriber.user_id == test_user.id,
			Subscriber.subscribe_id == user.id,
		)
	)

	subscribe = subscribe.unique().all()

	assert len(subscribe) == 0
