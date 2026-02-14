import uuid

from fastapi import APIRouter, Request, Response

from app.constants import DEVELOPMENT, FASTAPI_SESSION_KEY
from app.modules.session_token import create_session_token

router = APIRouter(tags=["session"])


@router.post("/set-session-cookie/")
def create_session_cookie(request: Request, response: Response):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	session_id = create_session_token(user_id=request.state.user.id)

	httponly = True
	secure = False if DEVELOPMENT == "1" else True
	samesite = "lax" if DEVELOPMENT == "1" else "none"

	response.set_cookie(
		key=FASTAPI_SESSION_KEY,
		value=session_id,
		httponly=httponly,  # Рекомендуется включить для безопасности
		secure=secure,  # False для localhost при разработке
		samesite=samesite,  # "none" для cross-origin
		max_age=30 * 24 * 60 * 60,  # 30 дней
		path="/",  # Доступно для всех путей
	)
	return {"ok": True, "message": "Session cookie set"}
