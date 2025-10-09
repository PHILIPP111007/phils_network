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
from app.models import Room, RoomInvitation, RoomSubscribers


async def test_room(session: AsyncSession, client: TestClient):
	user, token = await get_or_create_default_user(session=session)

	response = client.get(
		"/api/v2/room/",
		headers={"Authorization": f"Bearer {token.key}"},
	)
	assert response.status_code == 200
	data = response.json()

	assert data["ok"] == False
	assert data["error"] == "Not found rooms."

	test_user, test_token = await get_or_create_user(
		session=session, username="test_user", token_key="2"
	)

	body = {
		"name": "",
		"subscribers": [
			test_user.id,
		],
	}

	await session.refresh(token)

	response = client.post(
		"/api/v2/room/",
		json=body,
		headers={"Authorization": f"Bearer {token.key}"},
	)
	assert response.status_code == 200
	data = response.json()

	assert data["ok"] == False
	assert data["error"] == "Not provided room name."

	await session.refresh(token)

	body = {
		"name": "room_1",
		"subscribers": [
			test_user.id,
		],
	}

	response = client.post(
		"/api/v2/room/",
		json=body,
		headers={"Authorization": f"Bearer {token.key}"},
	)
	assert response.status_code == 200
	data = response.json()

	assert data["ok"] == True
	assert data["room"]["creator_id"] == 1
	assert data["room"]["id"] == 1
	assert data["room"]["name"] == "room_1"

	rooms = await session.exec(select(Room))
	rooms = rooms.unique().all()

	assert len(rooms) == 1

	await session.refresh(user)
	await session.refresh(test_user)

	room_subscribers = await session.exec(
		select(RoomSubscribers).where(
			RoomSubscribers.user_id == user.id,
			RoomSubscribers.room_id == data["room"]["id"],
		)
	)
	room_subscribers = room_subscribers.unique().all()

	assert len(room_subscribers) == 1

	room_invitations = await session.exec(
		select(RoomInvitation).where(
			RoomInvitation.creator_id == user.id,
			RoomInvitation.room_id == data["room"]["id"],
			RoomInvitation.to_user_id == test_user.id,
		)
	)
	room_invitations = room_invitations.unique().all()

	assert len(room_invitations) == 1

	await session.refresh(token)

	body = {
		"name": "room_2",
		"subscribers": [
			test_user.id,
		],
	}

	response = client.post(
		"/api/v2/room/",
		json=body,
		headers={"Authorization": f"Bearer {token.key}"},
	)
	assert response.status_code == 200
	data = response.json()

	assert data["ok"] == True
	assert data["room"]["creator_id"] == 1
	assert data["room"]["id"] == 2
	assert data["room"]["name"] == "room_2"

	rooms = await session.exec(select(Room))
	rooms = rooms.unique().all()

	assert len(rooms) == 2

	await session.refresh(user)
	await session.refresh(test_user)

	room_subscribers = await session.exec(
		select(RoomSubscribers).where(
			RoomSubscribers.user_id == user.id,
			RoomSubscribers.room_id == data["room"]["id"],
		)
	)
	room_subscribers = room_subscribers.unique().all()

	assert len(room_subscribers) == 1

	room_subscribers = await session.exec(
		select(RoomSubscribers).where(
			RoomSubscribers.user_id == user.id,
		)
	)
	room_subscribers = room_subscribers.unique().all()

	assert len(room_subscribers) == 2

	room_invitations = await session.exec(
		select(RoomInvitation).where(
			RoomInvitation.creator_id == user.id,
			RoomInvitation.room_id == data["room"]["id"],
			RoomInvitation.to_user_id == test_user.id,
		)
	)
	room_invitations = room_invitations.unique().all()

	assert len(room_invitations) == 1

	room_invitations = await session.exec(
		select(RoomInvitation).where(
			RoomInvitation.creator_id == user.id,
			RoomInvitation.to_user_id == test_user.id,
		)
	)
	room_invitations = room_invitations.unique().all()

	assert len(room_invitations) == 2


async def test_get_room_invitation(session: AsyncSession, client: TestClient):
	user, token = await get_or_create_default_user(session=session)
	test_user, test_token = await get_or_create_user(
		session=session, username="test_user", token_key="2"
	)

	await session.refresh(token)
	await session.refresh(test_user)
	await session.refresh(test_token)

	response = client.get(
		"/api/v2/invite_chats/",
		headers={"Authorization": f"Bearer {token.key}"},
	)
	assert response.status_code == 200
	data = response.json()

	assert data["ok"] == False
	assert data["error"] == "Not found room invitations."

	body = {
		"name": "room_1",
		"subscribers": [
			test_user.id,
		],
	}

	await session.refresh(token)

	response = client.post(
		"/api/v2/room/",
		json=body,
		headers={"Authorization": f"Bearer {token.key}"},
	)
	assert response.status_code == 200
	data = response.json()

	assert data["ok"] == True
	assert data["room"]["creator_id"] == 1
	assert data["room"]["id"] == 1
	assert data["room"]["name"] == "room_1"

	await session.refresh(test_token)

	response = client.get(
		"/api/v2/invite_chats/",
		headers={"Authorization": f"Bearer {test_token.key}"},
	)
	assert response.status_code == 200
	data = response.json()

	assert data["ok"] == True
	assert len(data["room_invitations"]) == 1

	room_invitation = data["room_invitations"][0]
	assert room_invitation["id"] == 1
	assert room_invitation["creator_id"] == 1
	assert room_invitation["creator"]["username"] == "admin"
