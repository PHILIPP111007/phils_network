from docx import Document
from openpyxl import load_workbook

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

		if message.file.path.endswith(".docx"):
			doc = Document(message.file.path)
			content = []
			for paragraph in doc.paragraphs:
				content.append(paragraph.text)
		elif message.file.path.endswith(".xlsx"):
			workbook = load_workbook(message.file.path)
			sheet = workbook.active
			content = []
			for row in sheet.iter_rows(values_only=True):
				content.append(row)
		else:
			with open(message.file.path, encoding="utf-8", errors="ignore") as f:
				content = f.readlines()

		return {"name": file_name, "content": content}
