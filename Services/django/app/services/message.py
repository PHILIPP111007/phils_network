import os

from app.models import Message, Room, User
from app.s3 import s3
from app.serializers import MessageSerializer, UserSerializer
from channels.db import database_sync_to_async

from django.conf import settings


@database_sync_to_async
def get_message_serialized_data(db_result):
	serializer = MessageSerializer(db_result)
	return serializer.data


class MessageService:
	@staticmethod
	async def create(
		room_id: int, sender_id: int, text: str, parent_id: int | None, sender_image
	) -> Message:
		query = await Message.objects.acreate(
			room_id=room_id, sender_id=sender_id, text=text, parent_id=parent_id
		)
		if parent_id:
			parent = await Message.objects.aget(pk=parent_id)
			parent_data = await get_message_serialized_data(db_result=parent)
			sender = await User.objects.aget(pk=parent_data["sender"])
			parent_data["sender"] = UserSerializer(sender).data
		else:
			parent_data = None

		message = await get_message_serialized_data(db_result=query)
		sender = await User.objects.aget(pk=message["sender"])
		message["parent"] = parent_data
		message["sender"] = UserSerializer(sender).data
		message["sender"]["image"] = sender_image
		message["file"] = {"path": message["file"], "content": None}
		message["likes"] = 0

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
