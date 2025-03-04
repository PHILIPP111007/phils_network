from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from app.serializers import RoomsInvitationSerializer
from app.services import RoomInvitationsService


class RoomInvitationsAddAPIView(APIView):
	service_class = RoomInvitationsService
	serializer_class = RoomsInvitationSerializer
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsAuthenticated,)

	def post(self, request: Request, username: str, room_id: int) -> Response:
		self.check_permissions(request=request)

		self.service_class.add(username=username, room_id=room_id)

		return Response(
			{"ok": True},
			status=status.HTTP_200_OK,
		)


class RoomInvitationsRemoveAPIView(APIView):
	service_class = RoomInvitationsService
	serializer_class = RoomsInvitationSerializer
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsAuthenticated,)

	def post(self, request: Request, username: str, room_id: int) -> Response:
		self.check_permissions(request=request)

		self.service_class.remove(room_id=room_id)

		return Response(
			{"ok": True},
			status=status.HTTP_200_OK,
		)
