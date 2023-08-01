import json

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from .models import Message
from .serializers import MessageSerializer


class ChatConsumer(AsyncWebsocketConsumer):

	@database_sync_to_async
	def create_message(self, message):
		msg = Message.objects.create(room_id=self.room, sender_id=message['sender_id'], text=message['text'])
		return MessageSerializer(msg).data

	async def connect(self):
		self.room = self.scope["url_route"]["kwargs"]["room"]
		self.room_group = self.room

		# Join room group
		await self.channel_layer.group_add(self.room_group, self.channel_name)
		await self.accept()

	async def disconnect(self, close_code):
		# Leave room group
		await self.channel_layer.group_discard(self.room_group, self.channel_name)

	# Receive message from WebSocket
	async def receive(self, text_data):
		text_data = json.loads(text_data)
		message = await self.create_message(text_data['message'])

		# Send message to room group
		await self.channel_layer.group_send(
			self.room_group, 
			{
				"type": "chat_message",
				"message": message
			}
		)

	# Receive message from room group
	async def chat_message(self, event):
		message = event["message"]

		# Send message to WebSocket
		await self.send(text_data=json.dumps(
			{
				'status': True,
				"message": message,
			}
		))
