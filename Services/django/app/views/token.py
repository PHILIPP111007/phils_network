from django.conf import settings as django_settings
from django.core.cache import cache
from djoser import utils
from djoser.conf import settings as djoser_settings
from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.serializers import Serializer


class TokenCreateView(utils.ActionViewMixin, generics.GenericAPIView):
	"""Use this endpoint to obtain user authentication token."""

	serializer_class = djoser_settings.SERIALIZERS.token_create
	permission_classes = djoser_settings.PERMISSIONS.token_create

	def _action(self, serializer):
		key = django_settings.TOKEN_CREATE_CACHE_KEY.format(serializer.user.username)
		token_cache = cache.get(key, None)

		if token_cache is None:
			cache.set(key, True, 10)

			token = utils.login_user(self.request, serializer.user)
			token_serializer_class = djoser_settings.SERIALIZERS.token
			return Response(
				data=token_serializer_class(token).data, status=status.HTTP_200_OK
			)
		else:
			return Response(
				{"ok": False, "error": "Got login limit"},
				status=status.HTTP_403_FORBIDDEN,
			)


class TokenDestroyView(views.APIView):
	"""Use this endpoint to logout user (remove user authentication token)."""

	serializer_class = Serializer
	permission_classes = djoser_settings.PERMISSIONS.token_destroy

	def post(self, request):
		utils.logout_user(request)
		return Response(status=status.HTTP_204_NO_CONTENT)
