from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from app.cache import get_user_cache
from app.permissions import IsOwnerOrReadOnly
from app.serializers import BlogSerializer
from app.services import (
	BlogService,
)
from django.core.cache import cache


class BlogAPIView(APIView):
	service_class = BlogService
	serializer_class = BlogSerializer
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsOwnerOrReadOnly, IsAuthenticated)

	def post(self, request: Request, **kwargs) -> Response:
		self.check_permissions(request=request)
		serializer = self.serializer_class(data=request.data)
		serializer.is_valid(raise_exception=True)
		serializer.save()

		user_cache: dict = get_user_cache(username=request.user)
		if user_cache:
			user_cache["blog"] = []
			cache.set(request.user, user_cache)

		return Response(
			{"ok": True, "post": serializer.data}, status=status.HTTP_200_OK
		)

	def put(self, request: Request, **kwargs) -> Response:
		"""Update post text."""

		self.check_permissions(request=request)
		pk = kwargs.get("pk", None)
		if pk is None:
			return Response(
				{"ok": False, "error": "You didn't submit a post id."},
				status=status.HTTP_404_NOT_FOUND,
			)

		post = self.service_class.filter(pk=pk).first()
		if post is None:
			return Response(
				{"ok": False, "error": "Not found the post."},
				status=status.HTTP_404_NOT_FOUND,
			)

		serializer = self.serializer_class(data=request.data, instance=post)
		serializer.is_valid(raise_exception=True)
		user = serializer.validated_data.get("user")
		self.check_object_permissions(request=request, obj=user)
		serializer.save()

		user_cache: dict = get_user_cache(username=request.user)
		if user_cache:
			user_cache["blog"] = []
			cache.set(request.user, user_cache)

		return Response(
			{"ok": True, "post": serializer.data}, status=status.HTTP_200_OK
		)

	def delete(self, request: Request, **kwargs) -> Response:
		self.check_permissions(request=request)
		pk = kwargs.get("pk", None)
		if pk is None:
			return Response(
				{"ok": False, "error": "You didn't submit a post id."},
				status=status.HTTP_404_NOT_FOUND,
			)

		post = self.service_class.filter(pk=pk).first()
		if post is None:
			return Response(
				{"ok": False, "error": "Not found the post."},
				status=status.HTTP_404_NOT_FOUND,
			)

		self.check_object_permissions(request=request, obj=post.user)
		post.delete()

		user_cache: dict = get_user_cache(username=request.user)
		if user_cache:
			user_cache["blog"] = []
			cache.set(request.user, user_cache)

		return Response({"ok": True}, status=status.HTTP_200_OK)
