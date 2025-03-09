from app.models import Message
from django.contrib.auth.models import User
from django.core.files import File
from django.core.files.uploadedfile import SimpleUploadedFile


class FileService:
	@staticmethod
	def create_message(sender: User, room_id: int, file):
		message = Message.objects.create(sender=sender, room_id=room_id, file=file)
		return message

	@staticmethod
	def get_file(message_id):
		message = Message.objects.filter(pk=message_id).first()
		data = File(open(message.file.path, "rb"))
		file_content = SimpleUploadedFile(
			message.file.name, data.read(), content_type="multipart/form-data"
		)
		file_name = message.file.path.split("/")[-1]

		return {"name": file_name, "content": file_content}
