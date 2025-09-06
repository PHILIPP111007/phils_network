__all__ = ["websocket_urlpatterns"]

from app.consumers import ChatConsumer
from django.urls import path

websocket_urlpatterns = [
	path("ws/v1/chat/<str:room>/", ChatConsumer.as_asgi()),
]
