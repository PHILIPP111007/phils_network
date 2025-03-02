from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from app.services import OnlineStatusService


class OnlineStatusAPIView(APIView):
	service_class = OnlineStatusService
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsAuthenticated,)

	def post(self, request: Request) -> Response:
		self.check_permissions(request=request)

		OnlineStatusService.create(user=request.user)

		return Response({"ok": True}, status=status.HTTP_200_OK)
