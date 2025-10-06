from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)

ANONYMOUS_USER = "user"
RESPONSE_CAN_NOT_AUTHENTICATE = {"ok": False, "error": "Can not authenticate."}


def test_get_post():
	response = client.get(f"/api/v2/blog/{ANONYMOUS_USER}/30/")
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE


def test_put_post():
	body = {
		"content": "",
	}

	response = client.put("/api/v2/blog/1/", json=body)
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE


def test_post_post():
	body = {
		"user": 1,
		"content": "",
	}

	response = client.post("/api/v2/blog/", json=body)
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE


def test_delete_post():
	response = client.delete("/api/v2/blog/1/")
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE
