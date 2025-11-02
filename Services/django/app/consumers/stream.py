import time

import orjson as json
from app.services import StreamService
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework.authtoken.models import Token

VIDEO_STREAMING_GROUP = "video_streaming_group_{}"
AUDIO_STREAMING_GROUP = "audio_streaming_group_{}"


class VideoStreamConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		token_key = self.scope["query_string"].decode().split("=", 1)[-1]
		pk = await _get_user_pk(token_key=token_key)

		if not pk:
			await self.close()
		else:
			room_id = int(self.scope["url_route"]["kwargs"]["room"])
			flag = await _check_permission(room_id=room_id, pk=pk)
			if flag:
				video_streaming_group = VIDEO_STREAMING_GROUP.format(room_id)
				await self.channel_layer.group_add(
					video_streaming_group, self.channel_name
				)
				await self.accept()
			else:
				await self.close()

	async def receive(self, text_data):
		try:
			data = json.loads(text_data)

			if time.time() - data["timestamp"] <= 1.0:
				room_id = data["room"]
				video_streaming_group = VIDEO_STREAMING_GROUP.format(room_id)

				# await self.channel_layer.group_send(
				# 	video_streaming_group,
				# 	{
				# 		"type": "broadcast_frame",
				# 		"frame": data["frame"],
				# 		"user": data["user"],
				# 		"active_users": data["active_users"],
				# 		"is_speaking": data["is_speaking"],
				# 		"current_speaker": data["current_speaker"],
				# 		"timestamp": data["timestamp"],
				# 	},
				# )

				data["type"] = "frame"
				await self.channel_layer.group_send(video_streaming_group, data)

		except Exception:
			await self.close()

	# Этот метод будет вызываться при групповой рассылке
	async def frame(self, event: dict):
		"""Отправляет кадр всем клиентам в комнате"""

		# await self.send(
		# 	text_data=json.dumps(
		# 		{
		# 			"type": "broadcast_frame",
		# 			"frame": event["frame"],
		# 			"user": event["user"],
		# 			"active_users": event["active_users"],
		# 			"is_speaking": event["is_speaking"],
		# 			"current_speaker": event["current_speaker"],
		# 			"timestamp": event["timestamp"],
		# 		},
		# 	)
		# )

		event["type"] = "frame"
		await self.send(text_data=json.dumps(event))


class AudioStreamConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		token_key = self.scope["query_string"].decode().split("=", 1)[-1]
		pk = await _get_user_pk(token_key=token_key)

		if not pk:
			await self.close()
		else:
			room_id = int(self.scope["url_route"]["kwargs"]["room"])
			flag = await _check_permission(room_id=room_id, pk=pk)
			if flag:
				audio_streaming_group = AUDIO_STREAMING_GROUP.format(room_id)
				await self.channel_layer.group_add(
					audio_streaming_group, self.channel_name
				)
				await self.accept()
			else:
				await self.close()

	async def receive(self, text_data):
		try:
			data = json.loads(text_data)

			if time.time() - data["timestamp"] <= 1.0:
				room_id = data["room"]
				audio_streaming_group = AUDIO_STREAMING_GROUP.format(room_id)

				# await self.channel_layer.group_send(
				# 	audio_streaming_group,
				# 	{
				# 		"type": "audio",
				# 		"audio": data["audio"],
				# 		"user": data["user"],
				# 		"active_users": data["active_users"],
				# 		"is_speaking": data["is_speaking"],
				# 		"current_speaker": data["current_speaker"],
				# 		"timestamp": data["timestamp"],
				# 	},
				# )

				data["type"] = "audio"
				await self.channel_layer.group_send(audio_streaming_group, data)

		except Exception:
			await self.close()

	async def audio(self, event: dict):
		"""Отправляет аудио всем клиентам в комнате"""
		# await self.send(
		# 	text_data=json.dumps(
		# 		{
		# 			"type": "audio",
		# 			"audio": event["audio"],
		# 			"user": event["user"],
		# 			"active_users": event["active_users"],
		# 			"is_speaking": event["is_speaking"],
		# 			"current_speaker": event["current_speaker"],
		# 			"timestamp": event["timestamp"],
		# 		},
		# 	)
		# )

		event["type"] = "audio"
		await self.send(text_data=json.dumps(event))


@database_sync_to_async
def _get_user_pk(token_key: str) -> int | None:
	token = Token.objects.filter(key=token_key).first()

	if token:
		return token.user_id
	return


@database_sync_to_async
def _check_permission(room_id: int, pk: int) -> bool:
	"""Check if user is this room subscriber."""

	return StreamService.check_permission(room_id=room_id, subscriber_id=pk)
