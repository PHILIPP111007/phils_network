from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)

ANONYMOUS_USER = "user"
RESPONSE_CAN_NOT_AUTHENTICATE = {"ok": False, "error": "Can not authenticate."}


def test_get_room():
	response = client.get("/api/v2/room/")
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE


def test_post_room():
	body = {
		"name": "",
		"subscribers": [],
	}

	response = client.post("/api/v2/room/", json=body)
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE


def test_get_room_invitation():
	response = client.get("/api/v2/invite_chats/")
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE


def test_post_room_invitation_add():
	response = client.post("/api/v2/invite_chats/1/add_room/1/")
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE


def test_post_room_invitation_remove():
	response = client.post("/api/v2/invite_chats/1/remove_room/1/")
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE
