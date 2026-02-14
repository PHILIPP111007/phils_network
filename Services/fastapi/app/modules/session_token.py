import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta
from typing import Optional

from app.constants import SECRET_KEY


def create_session_token(user_id: int) -> str:
	"""Создает подписанный сессионный токен"""
	# Данные сессии
	payload = {
		"user_id": user_id,
		"created_at": datetime.now().isoformat(),
		"expires_at": (datetime.now() + timedelta(days=30)).isoformat(),
	}

	# Кодируем payload в base64
	payload_json = json.dumps(payload, separators=(",", ":"))  # Минифицированный JSON
	payload_b64 = base64.urlsafe_b64encode(payload_json.encode()).decode()

	# Создаем подпись
	signature = hmac.new(
		SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256
	).hexdigest()

	# Формат: payload.signature
	return f"{payload_b64}.{signature}"


def verify_session_token(session_token: str) -> Optional[dict]:
	"""Проверяет и декодирует сессионный токен"""
	try:
		if not session_token or "." not in session_token:
			return None

		payload_b64, signature = session_token.split(".", 1)

		# Проверяем подпись
		expected_signature = hmac.new(
			SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256
		).hexdigest()

		if not hmac.compare_digest(signature, expected_signature):
			return None

		# Декодируем payload
		payload_json = base64.urlsafe_b64decode(payload_b64.encode()).decode()
		payload = json.loads(payload_json)

		# Проверяем срок действия
		expires_at = datetime.fromisoformat(payload["expires_at"])
		if datetime.now() > expires_at:
			return None

		return payload

	except (ValueError, json.JSONDecodeError, KeyError):
		return None
