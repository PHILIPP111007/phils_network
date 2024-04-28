from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework import status

from app.serializers import ChatSerializer
from app.services import RoomCreatorService, RoomService


class ChatAPIView(APIView):
	serializer_class = ChatSerializer
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsAuthenticated,)

	def get(self, request: Request, pk: int) -> Response:
		self.check_permissions(request=request)
		room = RoomService.filter(pk=pk).first()

		if room is None:
			return Response(
				{"ok": False, "error": "Not found room."},
				status=status.HTTP_404_NOT_FOUND,
			)

		creator_obj = RoomCreatorService.filter(pk=room.pk).first()
		if creator_obj is None:
			return Response(
				{"ok": False, "error": "Not found room creator."},
				status=status.HTTP_404_NOT_FOUND,
			)

		is_creator = creator_obj.creator == request.user
		return Response(
			{
				"ok": True,
				"isCreator": is_creator,
				"room": self.serializer_class(room).data,
			},
			status=status.HTTP_200_OK,
		)

	def put(self, request: Request, pk: int) -> Response:
		self.check_permissions(request=request)
		room = RoomService.put(pk=pk, request=request)

		if not room:
			return Response(
				{"ok": False, "error": "Not found room."},
				status=status.HTTP_404_NOT_FOUND,
			)

		return Response({"ok": True}, status=status.HTTP_200_OK)
