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

	def post(self, request, **kwargs):
		ip_address = request.META.get("REMOTE_ADDR", "unknown")
		key = django_settings.TOKEN_CREATE_CACHE_KEY.format(ip_address)
		token_cache = cache.get(key, None)

		if token_cache is None:
			cache.set(key, True, 10)
			return super().post(request, **kwargs)
		else:
			return Response(
				{"ok": False, "error": "Entry limit reached, wait 10 sec"},
				status=status.HTTP_403_FORBIDDEN,
			)

	def _action(self, serializer):
		token = utils.login_user(self.request, serializer.user)
		token_serializer_class = djoser_settings.SERIALIZERS.token
		return Response(
			data=token_serializer_class(token).data, status=status.HTTP_200_OK
		)


class TokenDestroyView(views.APIView):
	"""Use this endpoint to logout user (remove user authentication token)."""

	serializer_class = Serializer
	permission_classes = djoser_settings.PERMISSIONS.token_destroy

	def post(self, request):
		utils.logout_user(request)
		return Response(status=status.HTTP_204_NO_CONTENT)
