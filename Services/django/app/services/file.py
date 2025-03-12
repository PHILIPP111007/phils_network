__all__ = ["FileService"]


import os

from app.models import Message
from app.s3 import s3
from django.conf import settings
from django.contrib.auth.models import User


class FileService:
	@staticmethod
	def create_message(sender: User, room_id: int, file):
		message = Message.objects.create(sender=sender, room_id=room_id, file=file)

		file_name = message.file.path
		key_name = message.file.path

		s3.upload_file(file_name, settings.BUCKET_NAME, key_name)
		os.remove(message.file.path)
		return message
