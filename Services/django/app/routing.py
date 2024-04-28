__all__ = ["websocket_urlpatterns"]

from django.urls import path

from app.consumers import ChatConsumer


websocket_urlpatterns = [
	path("ws/chat/<str:room>/", ChatConsumer.as_asgi()),
]
