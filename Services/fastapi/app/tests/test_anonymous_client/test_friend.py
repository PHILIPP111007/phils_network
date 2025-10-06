from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)

OPTION = 1
RESPONSE_CAN_NOT_AUTHENTICATE = {"ok": False, "error": "Can not authenticate."}


def test_get_friends():
	response = client.get(f"/api/v2/friends/{OPTION}/")
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE
