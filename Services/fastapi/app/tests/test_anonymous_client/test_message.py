from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)

MESSAGE_ID = 1
RESPONSE_CAN_NOT_AUTHENTICATE = {"ok": False, "error": "Can not authenticate."}


def test_get_message():
	response = client.get(f"/api/v2/room/{MESSAGE_ID}/30/")
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE


def test_get_unread_message_count():
	response = client.get("/api/v2/get_unread_message_count/")
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE
