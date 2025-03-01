from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from app.services import SubscriberService


class SubscriberAPIView(APIView):
	service_class = SubscriberService
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsAuthenticated,)

	def get(self, request: Request, pk: int) -> Response:
		self.check_permissions(request=request)
		data = self.service_class.get_user_status(user=request.user, pk=pk)

		return Response({"ok": True, "status": data}, status=status.HTTP_200_OK)

	def post(self, request: Request, pk: int) -> Response:
		self.check_permissions(request=request)
		self.service_class.create(user_id=request.user.pk, subscribe_id=pk)

		return Response({"ok": True}, status=status.HTTP_200_OK)

	def delete(self, request: Request, pk: int) -> Response:
		self.check_permissions(request=request)

		resp = self.service_class.delete_by_option(request=request, pk=pk)
		if resp["ok"]:
			return Response(resp, status=status.HTTP_200_OK)
		return Response(resp, status=status.HTTP_404_NOT_FOUND)
