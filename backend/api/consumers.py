import json

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from .serializers import MessageSerializer
from .services import MessageService


class ChatConsumer(AsyncWebsocketConsumer):

	@database_sync_to_async
	def _create_message(self, message):
		"""Create message."""

		msg = MessageService.create(room_id=self.room, \
			sender_id=message["sender_id"], text=message["text"])

		return MessageSerializer(msg).data

	@database_sync_to_async
	def _check_permission(self, pk):
		"""Check if user is this room subscriber."""

		return MessageService.check_permission(room_id=self.room, \
			subscriber_id=pk)

	async def connect(self):
		"""Join room group."""

		self.room = self.scope["url_route"]["kwargs"]["room"]
		self.room_group = self.room

		await self.channel_layer.group_add(self.room_group, self.channel_name)
		await self.accept()

	async def disconnect(self, close_code):
		"""
		Called when a WebSocket connection is closed.
		Leave room group.
		"""

		await self.channel_layer.group_discard(self.room_group, \
			self.channel_name)

	async def receive(self, text_data):
		"""
		Called with a decoded WebSocket frame.
		Receive message from WebSocket and send it to room group.
		If the user is not a subscriber to the conversation,
		he will be disconnected.
		"""

		text_data = json.loads(text_data)
		pk = text_data["message"]["sender_id"]
		flag = await self._check_permission(pk)

		if flag:
			message = await self._create_message(text_data["message"])

			# Send message to room group
			await self.channel_layer.group_send(
				self.room_group, 
				{
					"type": "chat_message",
					"message": message
				}
			)
		else:
			self.disconnect()

	async def chat_message(self, event):
		"""Receive message from room group and send it to WebSocket."""

		await self.send(text_data=json.dumps(
			{
				"status": True,
				"message": event["message"],
			}
		))
