from django.urls import path

from api.consumers import ChatConsumer


websocket_urlpatterns = [
	path("ws/chat/<str:room>/", ChatConsumer.as_asgi()),
]
