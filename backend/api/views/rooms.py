from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework import status

from backend.api.serializers import RoomsSerializer
from backend.api.services import RoomService


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
