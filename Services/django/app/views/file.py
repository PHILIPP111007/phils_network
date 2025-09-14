__all__ = ["FileAPIView", "file_download"]


import os
import gzip
import shutil
from wsgiref.util import FileWrapper

from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from app.models import Message
from app.s3 import create_bucket, s3
from app.serializers import MessageSerializer
from app.services import FileService
from django.conf import settings
from django.http import HttpResponse, HttpResponseNotAllowed


class FileAPIView(APIView):
	service_class = FileService
	authentication_classes = (TokenAuthentication,)
	permission_classes = [IsAuthenticated]
	serializer_class = MessageSerializer

	def post(self, request: Request, room_id: int) -> Response:
		self.check_permissions(request=request)

		message = self.service_class.create_message(
			sender=request.user, room_id=room_id, file=request.FILES.get("file")
		)

		return Response(
			{"ok": True, "message": self.serializer_class(message).data},
			status=status.HTTP_200_OK,
		)


def file_download(request: Request, message_id: int, username: str) -> HttpResponse:
	if request.method != "GET":
		return HttpResponseNotAllowed(["GET"])

	for bucket in s3.list_buckets()["Buckets"]:
		if bucket["Name"] == settings.BUCKET_NAME:
			break
	else:
		create_bucket()

	message = Message.objects.filter(pk=message_id).first()
	room = message.room
	if not room.subscribers.filter(username=username).exists():
		return HttpResponse("Access denied.")

	file_path = message.file.path

	folders_to_create = file_path.split(os.path.sep)[:-1]
	folders_to_create = os.path.sep.join(folders_to_create)

	os.makedirs(folders_to_create, exist_ok=True)

	compressed_file_path = message.file.path + ".gz"

	with open(compressed_file_path, "wb") as file:
		s3.download_fileobj(settings.BUCKET_NAME, message.file.path, file)

	uncompressed_file_path = message.file.path
	with gzip.open(compressed_file_path, "rb") as f_in:
		with open(uncompressed_file_path, "wb") as f_out:
			shutil.copyfileobj(f_in, f_out)

	response = HttpResponse(
		FileWrapper(open(uncompressed_file_path, "rb")),
		content_type="application/octet-stream",
	)
	response["Content-Disposition"] = (
		f'attachment; filename="{os.path.basename(message.file.name)}"'
	)
	response["Content-Length"] = os.path.getsize(uncompressed_file_path)

	os.remove(compressed_file_path)
	os.remove(uncompressed_file_path)

	return response
