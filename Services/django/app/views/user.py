from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from app.permissions import IsOwnerOrReadOnly
from app.serializers import UserSerializer
from app.services import UserService


class UserAPIView(APIView):
	service_class = UserService
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsOwnerOrReadOnly, IsAuthenticated)

	def get(self, request: Request, username: str) -> Response:
		"""
		Global user for upper line of the app.
		Local user for user card and posts.
		"""

		self.check_permissions(request=request)
		global_user = self.service_class.filter(pk=request.user.pk)

		if not global_user.exists():
			return Response(
				{"ok": False, "error": "Not found the global user."},
				status=status.HTTP_404_NOT_FOUND,
			)

		query = {"ok": True, "global_user": self.serializer_class(global_user[0]).data}
		local_user = self.service_class.filter_by_username(username=username)[0]

		if local_user is not None:
			query["local_user"] = self.serializer_class(local_user).data

		return Response(query, status=status.HTTP_200_OK)

	def put(self, request: Request, **kwargs) -> Response:
		"""Updating user info."""

		self.check_permissions(request=request)
		user = self.service_class.filter(pk=request.user.pk).first()

		if user is None:
			return Response(
				{"ok": False, "error": "Not found the user."},
				status=status.HTTP_404_NOT_FOUND,
			)

		self.check_object_permissions(request=request, obj=user)
		user = self.service_class.put(user=user, request=request)

		return Response(
			{"ok": True, "user": self.serializer_class(user).data},
			status=status.HTTP_200_OK,
		)

	def delete(self, request: Request, **kwargs) -> Response:
		self.check_permissions(request=request)
		user = self.service_class.filter(pk=request.user.pk).first()

		if user is None:
			return Response(
				{"ok": False, "error": "Not found the user."},
				status=status.HTTP_404_NOT_FOUND,
			)

		self.check_object_permissions(request=request, obj=user)
		user.delete()

		return Response({"ok": True}, status=status.HTTP_200_OK)
