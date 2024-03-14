from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework import status

from backend.api.services import SubscriberService


class FriendsAPIView(APIView):
	service_class = SubscriberService
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsAuthenticated,)

	def get(self, request: Request, option: int) -> Response:
		self.check_permissions(request=request)
		query = self.service_class.filter_by_option(
			pk=request.user.pk, option=option, serializer=True
		)

		if not query:
			return Response(
				{"ok": False, "error": "Not found users."},
				status=status.HTTP_404_NOT_FOUND,
			)

		return Response({"ok": True, "query": query}, status=status.HTTP_200_OK)
