from fastapi.testclient import TestClient

from app.main import app
from app.tests.modules import create_upload_file


client = TestClient(app)

ANONYMOUS_USER = "user"
RESPONSE_CAN_NOT_AUTHENTICATE = {"ok": False, "error": "Can not authenticate."}


def test_get_user():
	response = client.get(f"/api/v2/user/{ANONYMOUS_USER}/")
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE


def test_put_user():
	body = {
		"first_name": "",
		"last_name": "",
		"email": "",
		"ethereum_address": "",
		"infura_api_key": "",
	}
	response = client.put("/api/v2/user/", json=body)
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE


def test_put_user_image():
	upload_file = create_upload_file("test.jpg")

	form_data = {
		"image": ("test.jpg", upload_file.file, "image/jpeg"),  # Тип MIME важен!
	}

	response = client.put("/api/v2/user_image/", files=form_data)
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE


def test_delete_user():
	response = client.delete(f"/api/v2/user/{ANONYMOUS_USER}/")
	assert response.status_code == 200
	assert response.json() == RESPONSE_CAN_NOT_AUTHENTICATE
