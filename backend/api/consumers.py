import json

from rest_framework.authtoken.models import Token

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from api.serializers import MessageSerializer
from api.services import MessageService


class ChatConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		"""
		Join room group.
		If the user is not a subscriber to the conversation,
		he will be disconnected.
		"""

		self.room = self.scope["url_route"]["kwargs"]["room"]
		self.room_group = self.room

		token_key = self.scope["query_string"].decode().split("=")[-1]
		pk = await _get_user_pk(token_key)

		if not pk:
			await self.close()
		else:
			flag = await _check_permission(self, pk)
			if flag:
				await self.channel_layer.group_add(self.room_group, self.channel_name)
				await self.accept()
			else:
				await self.close()

	async def disconnect(self, close_code):
		"""
		Called when a WebSocket connection is closed.
		Leave room group.
		"""

		await self.channel_layer.group_discard(self.room_group, self.channel_name)

	async def receive(self, text_data):
		"""
		Called with a decoded WebSocket frame.
		Receive message from WebSocket, create message in the DB
		and send it to room group.
		"""

		text_data = json.loads(text_data)
		message = await _create_message(self, text_data["message"])

		# Send message to room group
		await self.channel_layer.group_send(
			self.room_group, {"type": "chat_message", "message": message}
		)

	async def chat_message(self, event):
		"""Receive message from room group and send it to WebSocket."""

		await self.send(
			text_data=json.dumps(
				{
					"status": True,
					"message": event["message"],
				}
			)
		)


@database_sync_to_async
def _get_user_pk(token_key: str) -> int | None:
	token = Token.objects.filter(key=token_key).first()

	if token:
		return token.user_id
	return


@database_sync_to_async
def _check_permission(self, pk) -> bool:
	"""Check if user is this room subscriber."""

	room_id = int(self.scope["url_route"]["kwargs"]["room"])

	return MessageService.check_permission(room_id=room_id, subscriber_id=pk)


@database_sync_to_async
def _create_message(self, message):
	"""Create message."""

	msg = MessageService.create(
		room_id=self.room, sender_id=message["sender_id"], text=message["text"]
	)

	return MessageSerializer(msg).data
