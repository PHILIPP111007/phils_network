from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.serializers import Serializer
from djoser import utils

from djoser.conf import settings


class TokenCreateView(utils.ActionViewMixin, generics.GenericAPIView):
	"""Use this endpoint to obtain user authentication token."""

	serializer_class = settings.SERIALIZERS.token_create
	permission_classes = settings.PERMISSIONS.token_create

	def _action(self, serializer):
		token = utils.login_user(self.request, serializer.user)
		token_serializer_class = settings.SERIALIZERS.token
		return Response(
			data=token_serializer_class(token).data, status=status.HTTP_200_OK
		)


class TokenDestroyView(views.APIView):
	"""Use this endpoint to logout user (remove user authentication token)."""

	serializer_class = Serializer
	permission_classes = settings.PERMISSIONS.token_destroy

	def post(self, request):
		utils.logout_user(request)
		return Response(status=status.HTTP_204_NO_CONTENT)
