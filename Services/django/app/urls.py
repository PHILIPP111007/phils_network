"""
Create user:
POST http://127.0.0.1:8000/api/v1/auth/users/ {"username": "admin", "password": "123"}

Get user info:
headers -> Authorization -> Token d91dacef1757b45259d45372359d4f7c91a856c2
GET http://127.0.0.1:8000/api/v1/auth/users/me/

Get token and authorize (--> {"auth_token":"d91dacef1757b45259d45372359d4f7c91a856c2"}):
POST http://127.0.0.1:8000/api/v1/token/token/login/ {"username": "admin", "password": "123"}

Logout:
headers -> Authorization -> Token d91dacef1757b45259d45372359d4f7c91a856c2
POST http://127.0.0.1:8000/api/v1/token/token/logout/
"""

__all__ = ["urlpatterns", "websocket_urlpatterns"]


from django.urls import include, path, re_path

from app.views import FileAPIView, file_download, TokenCreateView, TokenDestroyView
from app.consumers import (
	ChatConsumer,
	DeleteMessageConsumer,
	OnlineStatusConsumer,
	LikeMessageConsumer,
)


urlpatterns = []

auth_urlpatterns = [
	path("auth/", include("djoser.urls")),
	re_path(r"^token/login/?$", TokenCreateView.as_view(), name="login"),
	re_path(r"^token/logout/?$", TokenDestroyView.as_view(), name="logout"),
]

file_urlpatterns = [
	path("file_upload/<int:room_id>/", FileAPIView.as_view()),
	path("file_download/<int:message_id>/<str:username>/", file_download),
]

urlpatterns += auth_urlpatterns + file_urlpatterns


websocket_urlpatterns = [
	path("ws/v1/chat/<str:room>/delete_message/", DeleteMessageConsumer.as_asgi()),
	path("ws/v1/chat/<str:room>/like_message/", LikeMessageConsumer.as_asgi()),
	path("ws/v1/chat/<str:room>/", ChatConsumer.as_asgi()),
	path("ws/v1/online_status/<str:user_id>/", OnlineStatusConsumer.as_asgi()),
]
