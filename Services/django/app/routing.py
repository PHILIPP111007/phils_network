__all__ = ["websocket_urlpatterns"]

from app.consumers import ChatConsumer, OnlineStatusConsumer
from django.urls import path

websocket_urlpatterns = [
	path("ws/chat/<str:room>/", ChatConsumer.as_asgi()),
	path("ws/online_status/<str:username>/", OnlineStatusConsumer.as_asgi()),
]
