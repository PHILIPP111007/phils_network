from django.core.cache import cache

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework import status

from .enums import FilterOption
from .permissions import IsOwnerOrReadOnly
from .serializers import (
	UserSerializer,
	BlogSerializer,
	RoomsSerializer,
	ChatSerializer,
	MessageSerializer,
)
from .services import (
	SubscriberStatus,
	UserService,
	SubscriberService,
	BlogService,
	RoomCreatorService,
	RoomService,
	MessageService,
)
from .cache import get_user_cache


class UserAPIView(APIView):
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsOwnerOrReadOnly, IsAuthenticated)

	def get(self, request: Request, username: str) -> Response:
		"""
		Global user for upper line of the app.
		Local user for user card and posts.
		"""

		self.check_permissions(request=request)
		global_user = UserService.filter(pk=request.user.pk)

		if not global_user.exists():
			return Response(
				{"ok": False, "error": "Not found the global user."},
				status=status.HTTP_404_NOT_FOUND,
			)

		query = {"ok": True, "global_user": self.serializer_class(global_user[0]).data}
		local_user = UserService.filter_by_username(username=username).first()

		if local_user is not None:
			query["local_user"] = self.serializer_class(local_user).data

		return Response(query, status=status.HTTP_200_OK)

	def put(self, request: Request, **kwargs) -> Response:
		"""Updating user info."""

		self.check_permissions(request=request)
		user = UserService.filter(pk=request.user.pk).first()

		if user is None:
			return Response(
				{"ok": False, "error": "Not found the user."},
				status=status.HTTP_404_NOT_FOUND,
			)

		self.check_object_permissions(request=request, obj=user)
		user = UserService.put(user=user, request=request)

		return Response(
			{"ok": True, "user": self.serializer_class(user).data},
			status=status.HTTP_200_OK,
		)

	def delete(self, request: Request, **kwargs) -> Response:
		self.check_permissions(request=request)
		user = UserService.filter(pk=request.user.pk).first()

		if user is None:
			return Response(
				{"ok": False, "error": "Not found the user."},
				status=status.HTTP_404_NOT_FOUND,
			)

		self.check_object_permissions(request=request, obj=user)
		user.delete()

		return Response({"ok": True}, status=status.HTTP_200_OK)


class BlogAPIView(APIView):
	serializer_class = BlogSerializer
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsOwnerOrReadOnly, IsAuthenticated)

	def get(self, request: Request, **kwargs) -> Response:
		self.check_permissions(request=request)

		username: str | None = kwargs.get("username", None)
		if not username:
			return Response(
				{"ok": False, "error": "No username provided."},
				status=status.HTTP_404_NOT_FOUND,
			)

		unknown = UserService.filter_by_username(username=username).first()
		if unknown is None:
			return Response(
				{"ok": False, "error": "Not found user."},
				status=status.HTTP_404_NOT_FOUND,
			)

		if request.user.pk != unknown.pk:
			data = SubscriberService.get_user_status(request=request, pk=unknown.pk)

			if data != SubscriberStatus.IS_FRIEND.value:
				return Response(
					{"ok": False, "error": "Make friends to see his blog."},
					status=status.HTTP_404_NOT_FOUND,
				)

		posts = BlogService.filter_by_username(**kwargs)
		if not posts:
			return Response(
				{"ok": False, "error": "Not found user posts."},
				status=status.HTTP_404_NOT_FOUND,
			)

		return Response(
			{"ok": True, "posts": posts},
			status=status.HTTP_200_OK,
		)

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

		post = BlogService.filter(pk=pk).first()
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

		post = BlogService.filter(pk=pk).first()
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


class FindUserAPIView(APIView):
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsAuthenticated,)

	def post(self, request: Request) -> Response:
		"""Find users in the network."""

		self.check_permissions(request=request)
		find_users = UserService.filter_find(request=request)

		if not find_users:
			return Response(
				{"ok": False, "error": "Not found users."},
				status=status.HTTP_404_NOT_FOUND,
			)

		return Response(
			{"ok": True, "users": self.serializer_class(find_users, many=True).data},
			status=status.HTTP_200_OK,
		)


class SubscriberAPIView(APIView):
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsAuthenticated,)

	def get(self, request: Request, pk: int) -> Response:
		self.check_permissions(request=request)
		data = SubscriberService.get_user_status(request=request, pk=pk)

		return Response({"ok": True, "status": data}, status=status.HTTP_200_OK)

	def post(self, request: Request, pk: int) -> Response:
		self.check_permissions(request=request)
		SubscriberService.create(user_id=request.user.pk, subscribe_id=pk)

		return Response({"ok": True}, status=status.HTTP_200_OK)

	def delete(self, request: Request, pk: int) -> Response:
		self.check_permissions(request=request)

		resp = SubscriberService.delete_by_option(request=request, pk=pk)
		if resp["ok"]:
			return Response(resp, status=status.HTTP_200_OK)
		return Response(resp, status=status.HTTP_404_NOT_FOUND)


class FriendsAPIView(APIView):
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsAuthenticated,)

	def get(self, request: Request, option: int) -> Response:
		self.check_permissions(request=request)
		query = SubscriberService.filter_by_option(
			pk=request.user.pk, option=option, serializer=True
		)

		if not query:
			return Response(
				{"ok": False, "error": "Not found users."},
				status=status.HTTP_404_NOT_FOUND,
			)

		return Response({"ok": True, "query": query}, status=status.HTTP_200_OK)


class NewsAPIView(APIView):
	serializer_class = BlogSerializer
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsAuthenticated,)

	def get(self, request: Request, loaded_posts: int) -> Response:
		self.check_permissions(request=request)

		friends = (
			SubscriberService.filter_by_option(
				pk=request.user.pk, option=FilterOption.FRIENDS.value, serializer=False
			)
			.only("pk")
			.values_list("pk", flat=True)
		)

		posts = BlogService.filter_by_friends(
			friends=friends, loaded_posts=loaded_posts
		)

		if not posts.exists():
			return Response(
				{"ok": False, "error": "Not found posts."},
				status=status.HTTP_404_NOT_FOUND,
			)

		return Response(
			{"ok": True, "posts": self.serializer_class(posts, many=True).data},
			status=status.HTTP_200_OK,
		)


class RoomsAPIView(APIView):
	serializer_class = RoomsSerializer
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsAuthenticated,)

	def get(self, request: Request) -> Response:
		self.check_permissions(request=request)
		rooms = RoomService.filter_by_subscriber(pk=request.user.pk)

		if not rooms.exists():
			return Response(
				{"ok": False, "error": "Not found rooms."},
				status=status.HTTP_404_NOT_FOUND,
			)

		return Response(
			{"ok": True, "rooms": self.serializer_class(rooms, many=True).data},
			status=status.HTTP_200_OK,
		)

	def post(self, request: Request) -> Response:
		self.check_permissions(request=request)
		room = RoomService.create(request=request)

		if not room:
			return Response(
				{"ok": False, "error": "Not found room."},
				status=status.HTTP_404_NOT_FOUND,
			)

		return Response(
			{"ok": True, "room": self.serializer_class(room).data},
			status=status.HTTP_200_OK,
		)


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


class MessagesAPIView(APIView):
	serializer_class = MessageSerializer
	authentication_classes = (TokenAuthentication,)
	permission_classes = (IsAuthenticated,)

	def get(self, request: Request, pk: int, loaded_messages: int) -> Response:
		self.check_permissions(request=request)
		messages = MessageService.filter(room_id=pk, loaded_messages=loaded_messages)

		if not messages.exists():
			return Response(
				{"ok": False, "error": "Not found messages."},
				status=status.HTTP_404_NOT_FOUND,
			)

		return Response(
			{"ok": True, "messages": self.serializer_class(messages, many=True).data},
			status=status.HTTP_200_OK,
		)
