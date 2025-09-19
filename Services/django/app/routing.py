__all__ = ["websocket_urlpatterns"]

from app.consumers import ChatConsumer, DeleteMessageConsumer
from django.urls import path

websocket_urlpatterns = [
	path("ws/v1/chat/<str:room>/delete_message/", DeleteMessageConsumer.as_asgi()),
	path("ws/v1/chat/<str:room>/", ChatConsumer.as_asgi()),
]
