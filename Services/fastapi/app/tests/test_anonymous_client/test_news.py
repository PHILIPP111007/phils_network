from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)

RESPONSE_CAN_NOT_AUTHENTICATE = {"ok": False, "error": "Can not authenticate."}


def test_get_news():
	response = client.get("/api/v2/news/30/")
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE
