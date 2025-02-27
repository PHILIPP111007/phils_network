from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from app.serializers import RoomsInvitationSerializer, RoomsSerializer
from app.services import RoomInvitationsService, RoomService


class RoomsAPIView(APIView):
	service_class = RoomService
	serializer_class = RoomsSerializer
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsAuthenticated,)

	def get(self, request: Request) -> Response:
		self.check_permissions(request=request)
		rooms = self.service_class.filter_by_subscriber(pk=request.user.pk)

		if not rooms.exists():
			return Response(
				{"ok": False, "error": "Not found rooms."},
				status=status.HTTP_404_NOT_FOUND,
			)

		return Response(
			{"ok": True, "rooms": self.serializer_class(rooms, many=True).data},
			status=status.HTTP_200_OK,
		)

	def post(self, request: Request) -> Response:
		self.check_permissions(request=request)
		room = self.service_class.create(request=request)

		if not room:
			return Response(
				{"ok": False, "error": "Not found room."},
				status=status.HTTP_404_NOT_FOUND,
			)

		return Response(
			{"ok": True, "room": self.serializer_class(room).data},
			status=status.HTTP_200_OK,
		)


class RoomInvitationsAPIView(APIView):
	service_class = RoomInvitationsService
	serializer_class = RoomsInvitationSerializer
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsAuthenticated,)

	def get(self, request: Request, username: str) -> Response:
		self.check_permissions(request=request)
		rooms = self.service_class.filter(user=request.user)

		if not rooms.exists():
			return Response(
				{"ok": False, "error": "Not found rooms."},
				status=status.HTTP_404_NOT_FOUND,
			)

		return Response(
			{"ok": True, "rooms": self.serializer_class(rooms, many=True).data},
			status=status.HTTP_200_OK,
		)


class RoomInvitationsAddAPIView(APIView):
	service_class = RoomInvitationsService
	serializer_class = RoomsInvitationSerializer
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsAuthenticated,)

	def post(self, request: Request, username: str, room_id: int) -> Response:
		self.check_permissions(request=request)

		self.service_class.add(user=request.user, room_id=room_id)

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
