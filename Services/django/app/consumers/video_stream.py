import asyncio
import base64
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO

from app.services import MessageService
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from PIL import Image
from rest_framework.authtoken.models import Token

from django.conf import settings

logger = logging.getLogger(__name__)

VIDEO_STREAMING_GROUP = "video_streaming_group_{}"


class VideoStreamConsumer(AsyncWebsocketConsumer):
	def __init__(self):
		super().__init__()
		self.executor = ThreadPoolExecutor(
			max_workers=settings.NUM_WORKERS_VIDEO_STREAMING
		)

	async def connect(self):
		token_key = self.scope["query_string"].decode().split("=")[-1]
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

			room_id = data["room"]
			video_streaming_group = VIDEO_STREAMING_GROUP.format(room_id)

			current_user = None
			if data["type"] == "audio_data":
				current_user = data["user"]["username"]

			if data["type"] == "video_frame":
				if current_user is None:
					active_users = sorted(data["active_users"])
					if len(active_users) != 0:
						one_active_user = active_users[0]
						current_user = data["user"]["username"]

						if one_active_user != current_user:
							return

				# Обрабатываем кадр и рассылаем всем участникам комнаты
				processed_frame = await self.process_frame_async(data["frame"])

				if processed_frame:
					# Отправляем обработанный кадр ВСЕМ подключенным клиентам
					await self.channel_layer.group_send(
						video_streaming_group,
						{
							"type": "broadcast_frame",
							"frame": processed_frame,
							"user": data["user"],
							"active_users": data["active_users"],
						},
					)

			elif data["type"] == "audio_data":
				await self.channel_layer.group_send(
                video_streaming_group,
					{
						"type": "broadcast_audio",
						"audio": data["audio"],
						"user": data["user"],
						"active_users": data["active_users"],
					},
				)

		except Exception:
			await self.close()

	# Этот метод будет вызываться при групповой рассылке
	async def broadcast_frame(self, event):
		"""Отправляет кадр всем клиентам в комнате"""
		await self.send(
			text_data=json.dumps(
				{
					"type": "broadcast_frame",
					"frame": event["frame"],
					"user": event["user"],
					"active_users": event["active_users"],
				}
			)
		)
	
	async def broadcast_audio(self, event):
		"""Отправляет аудио всем клиентам в комнате"""
		await self.send(
			text_data=json.dumps({
				"type": "broadcast_audio", 
				"audio": event["audio"],
				"user": event["user"],
			})
		)

	async def process_frame_async(self, frame_data):
		loop = asyncio.get_event_loop()
		result = await loop.run_in_executor(
			self.executor, self.process_frame, frame_data
		)
		return result

	def process_frame(self, frame_data):
		"""Обработка кадра"""

		try:
			# Извлекаем base64 данные
			header, encoded = frame_data.split(",", 1)
			image_bytes = base64.b64decode(encoded)

			# Открываем изображение
			image = Image.open(BytesIO(image_bytes))

			# Конвертируем обратно
			buffer = BytesIO()
			image.save(buffer, format="JPEG", quality=80, optimize=True)
			processed_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

			return f"data:image/jpeg;base64,{processed_b64}"

		except Exception as e:
			logger.error(f"Frame processing error: {e}")
			return


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
