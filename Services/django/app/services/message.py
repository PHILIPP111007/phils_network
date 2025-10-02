import os

from django.conf import settings
from channels.db import database_sync_to_async

from app.serializers import MessageSerializer, UserSerializer
from app.models import Message, Room, User
from app.s3 import s3


@database_sync_to_async
def get_message_serialized_data(db_result):
    serializer = MessageSerializer(db_result)
    return serializer.data


class MessageService:
	@staticmethod
	async def create(room_id: int, sender_id: int, text: str) -> Message:
		obj = await Message.objects.acreate(room_id=room_id, sender_id=sender_id, text=text)
		message = await get_message_serialized_data(db_result=obj)
		sender = await User.objects.aget(pk=message["sender"])
		message["sender"] = UserSerializer(sender).data
		message["file"] = {"path": message["file"], "content": None}

		return message

	@staticmethod
	def delete(message_id: int):
		msg = Message.objects.filter(pk=message_id).first()
		if msg:
			if msg.file:
				file_path = os.path.join(settings.MEDIA_ROOT, msg.file.path)
				s3.delete_object(Bucket=settings.BUCKET_NAME, Key=file_path)
			msg.delete()

	@staticmethod
	def check_permission(room_id: int, subscriber_id: int) -> bool:
		"""Check if user is the Room subscriber."""

		room = Room.objects.get(pk=room_id)
		flag = room.subscribers.filter(pk=subscriber_id).exists()

		return flag
