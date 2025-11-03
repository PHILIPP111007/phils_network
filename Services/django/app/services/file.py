__all__ = ["FileService"]


import gzip
import io
import os

from app.models import Message
from app.s3 import create_bucket, s3

from django.conf import settings
from django.contrib.auth.models import User


class FileService:
	@staticmethod
	def create(sender: User, room_id: int, text: str, file):
		for bucket in s3.list_buckets()["Buckets"]:
			if bucket["Name"] == settings.BUCKET_NAME:
				break
		else:
			create_bucket()

		message = Message.objects.create(
			sender=sender, room_id=room_id, text=text, file=file
		)

		file_path = message.file.path

		with message.file.open("rb") as f_in:
			original_data = f_in.read()

		compressed_data = gzip.compress(original_data)

		with io.BytesIO(compressed_data) as compressed_stream:
			s3.upload_fileobj(compressed_stream, settings.BUCKET_NAME, file_path)

		os.remove(message.file.path)
		return message
