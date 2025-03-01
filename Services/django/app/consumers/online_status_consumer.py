__all__ = ["OnlineStatusConsumer"]


from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework.authtoken.models import Token

from app.models import OnlineStatus


class OnlineStatusConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		"""
		Join room group.
		If the user is not a subscriber to the conversation,
		he will be disconnected.
		"""

		self.username = self.scope["url_route"]["kwargs"]["username"]
		self.username_group = self.username

		token_key = self.scope["query_string"].decode().split("=")[-1]
		pk = await _get_user_pk(token_key)

		if not pk:
			await self.close()
		else:
			await _create_online_status(username=self.username)
			await self.channel_layer.group_add(self.username_group, self.channel_name)
			await self.accept()

	async def disconnect(self, close_code):
		"""
		Called when a WebSocket connection is closed.
		Leave room group.
		"""

		await _remove_online_status(username=self.username)

		await self.channel_layer.group_discard(self.username_group, self.channel_name)

	async def receive(self, text_data):
		"""
		Called with a decoded WebSocket frame.
		Receive message from WebSocket, create message in the DB
		and send it to room group.
		"""
		...

	async def chat_message(self, event):
		"""Receive message from room group and send it to WebSocket."""
		...


@database_sync_to_async
def _get_user_pk(token_key: str) -> int | None:
	token = Token.objects.filter(key=token_key).first()

	if token:
		return token.user_id
	return


@database_sync_to_async
def _create_online_status(username: str) -> None:
	online_status = OnlineStatus.objects.filter(user__username=username).first()
	if online_status:
		online_status.is_online = True
		online_status.save()


@database_sync_to_async
def _remove_online_status(username: str) -> None:
	online_status = OnlineStatus.objects.filter(user__username=username).first()
	if online_status:
		online_status.is_online = False
		online_status.save()
