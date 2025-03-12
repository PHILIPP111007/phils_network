import os
from wsgiref.util import FileWrapper

from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from app.models import Message
from app.s3 import s3
from app.serializers import MessageSerializer
from app.services import FileService
from django.conf import settings
from django.http import HttpResponse


class FileUploadAPIView(APIView):
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


def file_download(request: Request, message_id: int):
	if request.method == "GET":
		message = Message.objects.filter(pk=message_id).first()
		file_path = message.file.path

		folders_to_create = file_path.split(os.path.sep)[:-1]
		folders_to_create = os.path.sep.join(folders_to_create)

		os.makedirs(folders_to_create, exist_ok=True)

		with open(file_path, "wb") as file:
			s3.download_fileobj(settings.BUCKET_NAME, message.file.path, file)
			file.seek(0)

		file = open(file_path, "rb")

		response = HttpResponse(FileWrapper(file))
		file.close()
		os.remove(file_path)
		return response
	else:
		return HttpResponse("Method not allowed.")
