from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)

ROOM_ID = 1
RESPONSE_CAN_NOT_AUTHENTICATE = {"ok": False, "error": "Can not authenticate."}


def test_get_chat():
	response = client.get(f"/api/v2/room/{ROOM_ID}/")
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE


def test_put_chat():
	body = {
		"friends": [],
		"subscribers": [],
	}
	response = client.put(f"/api/v2/room/{ROOM_ID}/", json=body)
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE
