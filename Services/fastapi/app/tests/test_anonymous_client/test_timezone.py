from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)

RESPONSE_CAN_NOT_AUTHENTICATE = {"ok": False, "error": "Can not authenticate."}


def test_post_timezone():
	body = {
		"timezone": "",
	}
	response = client.post("/api/v2/timezone/", json=body)
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE
