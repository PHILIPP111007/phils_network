from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)

RESPONSE_CAN_NOT_AUTHENTICATE = {"ok": False, "error": "Can not authenticate."}


def test_post_online_status_true():
	response = client.post("/api/v2/online_status/set_true/")
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE


def test_post_online_status_false():
	response = client.post("/api/v2/online_status/set_false/")
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE
