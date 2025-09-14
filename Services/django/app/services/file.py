__all__ = ["FileService"]


import os
import gzip
import tempfile

from app.models import Message
from app.s3 import create_bucket, s3
from django.conf import settings
from django.contrib.auth.models import User


class FileService:
	@staticmethod
	def create_message(sender: User, room_id: int, file):
		for bucket in s3.list_buckets()["Buckets"]:
			if bucket["Name"] == settings.BUCKET_NAME:
				break
		else:
			create_bucket()

		message = Message.objects.create(sender=sender, room_id=room_id, file=file)

		file_path = message.file.path

		# Using a temporary file for compression
		with open(file_path, "rb") as f_in:
			with tempfile.NamedTemporaryFile() as temp_gz_file:
				with gzip.open(temp_gz_file.name, "wb") as gz_out:
					gz_out.write(f_in.read())

				s3.upload_file(temp_gz_file.name, settings.BUCKET_NAME, file_path)
		os.remove(message.file.path)
		return message
