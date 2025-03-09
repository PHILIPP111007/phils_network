from app.models import Message
from django.contrib.auth.models import User


class FileService:
	@staticmethod
	def create_message(sender: User, room_id: int, file):
		message = Message.objects.create(sender=sender, room_id=room_id, file=file)
		return message

	@staticmethod
	def get_file(message_id):
		message = Message.objects.filter(pk=message_id).first()

		file_name = message.file.path.split("/")[-1]

		with open(message.file.path, encoding="utf-8", errors="ignore") as f:
			data = f.read()
			print(data)

		return {"name": file_name, "content": data}
