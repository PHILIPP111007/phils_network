from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from app.serializers import MessageSerializer
from app.services import FileService


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


class FileDownloadAPIView(APIView):
	service_class = FileService
	authentication_classes = (TokenAuthentication,)
	permission_classes = [IsAuthenticated]

	def get(self, request: Request, message_id: int) -> Response:
		self.check_permissions(request=request)

		file = self.service_class.get_file(message_id=message_id)

		return Response({"ok": True, "file": file}, status=status.HTTP_200_OK)
