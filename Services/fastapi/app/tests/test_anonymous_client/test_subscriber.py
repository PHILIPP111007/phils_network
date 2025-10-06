from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)

RESPONSE_CAN_NOT_AUTHENTICATE = {"ok": False, "error": "Can not authenticate."}


def test_get_subscriber():
	response = client.get("/api/v2/subscriber/1/")
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE


def test_post_subscriber():
	response = client.post("/api/v2/subscriber/1/")
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE
