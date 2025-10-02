__all__ = ["ChatConsumer"]

import os
import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework.authtoken.models import Token

from app.services import MessageService


CHAT_GROUP = "chat_{}"
DELETE_MESSAGE_GROUP = "delete_message_{}"


class ChatConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		"""
		Join room group.
		If the user is not a subscriber to the conversation,
		he will be disconnected.
		"""

		token_key = self.scope["query_string"].decode().split("=")[-1]
		pk = await _get_user_pk(token_key=token_key)

		if not pk:
			await self.close()
		else:
			room_id = int(self.scope["url_route"]["kwargs"]["room"])
			flag = await _check_permission(room_id=room_id, pk=pk)
			if flag:
				chat_group = CHAT_GROUP.format(room_id)
				await self.channel_layer.group_add(chat_group, self.channel_name)
				await self.accept()
			else:
				await self.close()

	async def receive(self, text_data):
		"""
		Called with a decoded WebSocket frame.
		Receive message from WebSocket, create message in the DB
		and send it to room group.
		"""

		text_data = json.loads(text_data)

		message = text_data["message"]
		if message["file"]["path"]:
			message["file"]["path"] = os.path.basename(message["file"]["path"])
		else:
			message = await _create_message(room_id=message["room"], message=message)

		# Send message to room group
		chat_group = CHAT_GROUP.format(message["room"])

		await self.channel_layer.group_send(
			chat_group, {"type": "chat_message", "message": message}
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


class DeleteMessageConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		"""
		Join room group.
		If the user is not a subscriber to the conversation,
		he will be disconnected.
		"""

		token_key = self.scope["query_string"].decode().split("=")[-1]
		pk = await _get_user_pk(token_key=token_key)

		if not pk:
			await self.close()
		else:
			room_id = int(self.scope["url_route"]["kwargs"]["room"])
			flag = await _check_permission(room_id=room_id, pk=pk)
			if flag:
				delete_message_group = DELETE_MESSAGE_GROUP.format(room_id)
				await self.channel_layer.group_add(
					delete_message_group, self.channel_name
				)
				await self.accept()
			else:
				await self.close()

	async def receive(self, text_data):
		"""
		Called with a decoded WebSocket frame.
		Receive message from WebSocket, create message in the DB
		and send it to room group.
		"""

		text_data = json.loads(text_data)

		message = text_data["message"]
		room_id = message["room_id"]

		await _delete_message(message_id=message["message_id"])

		# Send message to room group
		delete_message_group = DELETE_MESSAGE_GROUP.format(room_id)
		await self.channel_layer.group_send(
			delete_message_group,
			{"type": "chat_message", "status": True, "message": message},
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
def _check_permission(room_id: int, pk: int) -> bool:
	"""Check if user is this room subscriber."""

	return MessageService.check_permission(room_id=room_id, subscriber_id=pk)


async def _create_message(room_id: int, message: dict) -> dict:
	"""Create message."""

	msg = await MessageService.create(
		room_id=room_id, sender_id=message["sender_id"], text=message["text"]
	)
	return msg


@database_sync_to_async
def _delete_message(message_id: int) -> dict:
	"""Delete message."""

	MessageService.delete(message_id=message_id)
