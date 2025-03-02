from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from app.serializers import MessageSerializer
from app.services import MessageService


class MessagesAPIView(APIView):
	service_class = MessageService
	serializer_class = MessageSerializer
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsAuthenticated,)

	def get(self, request: Request, pk: int, loaded_messages: int) -> Response:
		self.check_permissions(request=request)

		if not MessageService.check_permission(
			room_id=pk, subscriber_id=request.user.pk
		):
			return Response(
				{"ok": False, "error": "Access denied."},
				status=status.HTTP_404_NOT_FOUND,
			)

		messages = self.service_class.filter(
			room_id=pk, loaded_messages=loaded_messages
		)

		if not messages.exists():
			return Response(
				{"ok": False, "error": "Not found messages."},
				status=status.HTTP_404_NOT_FOUND,
			)

		return Response(
			{"ok": True, "messages": self.serializer_class(messages, many=True).data},
			status=status.HTTP_200_OK,
		)
