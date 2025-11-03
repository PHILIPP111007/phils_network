__all__ = ["FileAPIView", "file_download"]


import gzip
import io
import os

from app.models import Message
from app.s3 import create_bucket, s3
from app.serializers import MessageSerializer
from app.services import FileService
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from django.conf import settings
from django.http import HttpResponse, HttpResponseNotAllowed


class FileAPIView(APIView):
	service_class = FileService
	authentication_classes = (TokenAuthentication,)
	permission_classes = [IsAuthenticated]
	serializer_class = MessageSerializer

	def post(self, request: Request, room_id: int) -> Response:
		self.check_permissions(request=request)

		message = self.service_class.create(
			sender=request.user,
			room_id=room_id,
			text=request.POST.get("text"),
			file=request.FILES.get("file"),
		)

		return Response(
			{"ok": True, "message": self.serializer_class(message).data},
			status=status.HTTP_200_OK,
		)


def file_download(request: Request, message_id: int, username: str) -> HttpResponse:
	if request.method != "GET":
		return HttpResponseNotAllowed(["GET"])

	# Check and create bucket if needed
	for bucket in s3.list_buckets()["Buckets"]:
		if bucket["Name"] == settings.BUCKET_NAME:
			break
	else:
		create_bucket()

	message = Message.objects.filter(pk=message_id).first()
	if not message:
		return HttpResponse("Message not found.", status=404)

	room = message.room
	if not room.subscribers.filter(username=username).exists():
		return HttpResponse("Access denied.", status=403)

	# Download compressed data directly to memory
	compressed_stream = io.BytesIO()
	s3.download_fileobj(settings.BUCKET_NAME, message.file.path, compressed_stream)
	compressed_stream.seek(0)

	# Decompress in memory
	with gzip.GzipFile(fileobj=compressed_stream, mode="rb") as f_in:
		decompressed_data = f_in.read()

	# Create response with decompressed data
	response = HttpResponse(decompressed_data, content_type="application/octet-stream")
	response["Content-Disposition"] = (
		f'attachment; filename="{os.path.basename(message.file.name)}"'
	)
	response["Content-Length"] = len(decompressed_data)

	return response
