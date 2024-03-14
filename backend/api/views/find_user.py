from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework import status

from backend.api.serializers import UserSerializer
from backend.api.services import UserService


class FindUserAPIView(APIView):
	service_class = UserService
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsAuthenticated,)

	def post(self, request: Request) -> Response:
		"""Find users in the network."""

		self.check_permissions(request=request)
		find_users = self.service_class.filter_find(request=request)

		if not find_users:
			return Response(
				{"ok": False, "error": "Not found users."},
				status=status.HTTP_404_NOT_FOUND,
			)

		return Response(
			{"ok": True, "users": self.serializer_class(find_users, many=True).data},
			status=status.HTTP_200_OK,
		)
