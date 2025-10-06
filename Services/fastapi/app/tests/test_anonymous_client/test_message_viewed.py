from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)

MESSAGE_ID = 1
RESPONSE_CAN_NOT_AUTHENTICATE = {"ok": False, "error": "Can not authenticate."}


def test_post_message_viewed():
	response = client.post(f"/api/v2/message_viewed/{MESSAGE_ID}/")
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE
