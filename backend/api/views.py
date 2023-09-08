from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework import status

from .permissions import IsOwnerOrReadOnly
from .serializers import (
	UserSerializer,
	BlogSerializer,
	RoomSerializer,
	MessageSerializer
)
from .services import (
	SubscriberStatus,
	UserService,
	SubscriberService,
	BlogService,
	RoomCreatorService,
	RoomService,
	MessageService
)


class UserAPIView(APIView):
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsOwnerOrReadOnly, IsAuthenticated)

	def get(self, request: Request, username: str) -> Response:
		"""
		Global user for upper line of the app.
		Local user for user card and posts.
		"""

		self.check_permissions(request=request)
		global_user = UserService.filter(pk=request.user.id)

		if not global_user.exists():
			return Response({"ok": False, \
					"error_message": "Not found the global user."}, \
						status=status.HTTP_404_NOT_FOUND)
		
		query = {"ok": True, "global_user": UserSerializer(global_user[0]).data}
		local_user = UserService.filter_by_username(username=username)

		if local_user.exists():
			query["local_user"] = UserSerializer(local_user[0]).data

		return Response(query, status=status.HTTP_200_OK)

	def put(self, request: Request, **kwargs) -> Response:
		"""Updating user info."""

		self.check_permissions(request=request)
		user = UserService.filter(pk=request.user.id)

		if not user.exists():
			return Response({"ok": False, \
					"error_message": "Not found the user."}, \
						status=status.HTTP_404_NOT_FOUND)

		user = user[0]
		self.check_object_permissions(request=request, obj=user)
		user = UserService.put(user=user, request=request)

		return Response({"ok": True, "user": UserSerializer(user).data}, \
				status=status.HTTP_200_OK)

	def delete(self, request: Request, **kwargs) -> Response:
		self.check_permissions(request=request)
		user = UserService.filter(pk=request.user.id)

		if not user.exists():
			return Response({"ok": False, \
					"error_message": "Not found the user."}, \
						status=status.HTTP_404_NOT_FOUND)
		
		user = user[0]
		self.check_object_permissions(request=request, obj=user)
		user.delete()

		return Response({"ok": True}, status=status.HTTP_200_OK)


class BlogAPIView(APIView):
	serializer_class = BlogSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsOwnerOrReadOnly, IsAuthenticated)

	def get(self, request: Request, **kwargs) -> Response:
		self.check_permissions(request=request)

		username: str | None = kwargs.get("username", None)
		if not username:
			return Response({"ok": False, "error_message": "No username provided."}, \
						status=status.HTTP_404_NOT_FOUND)

		unknown = UserService.filter_by_username(username=username)
		if not unknown.exists():
			return Response({"ok": False, "error_message": "Not found user."}, \
						status=status.HTTP_404_NOT_FOUND)

		unknown_id: int = unknown[0].id

		if request.user.id != unknown_id:
			data = SubscriberService.get_user_status(request=request, pk=unknown_id)

			if data != SubscriberStatus.IS_FRIEND:
				return Response({"ok": False, \
						"error_message": "Make friends to see his blog."}, \
							status=status.HTTP_404_NOT_FOUND)

		posts = BlogService.filter_by_username(**kwargs)

		if not posts.exists():
			return Response({"ok": False, \
					"error_message": "Not found user posts."}, \
						status=status.HTTP_404_NOT_FOUND)

		return Response({"ok": True, \
					"posts": BlogSerializer(posts, many=True).data}, \
						status=status.HTTP_200_OK)

	def post(self, request: Request, **kwargs) -> Response:
		self.check_permissions(request=request)
		serializer = BlogSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		serializer.save()

		return Response({"ok": True, "post": serializer.data}, \
				status=status.HTTP_200_OK)

	def put(self, request: Request, **kwargs) -> Response:
		"""Update post text."""

		self.check_permissions(request=request)
		pk = kwargs.get("pk", None)
		if pk is None:
			return Response({"ok": False, \
					"error_message": "You didn't submit a post id."}, \
						status=status.HTTP_404_NOT_FOUND)

		post = BlogService.filter(pk=pk)
		if not post.exists():
			return Response({"ok": False, "error_message": "Not found the post."}, \
						status=status.HTTP_404_NOT_FOUND)

		post = post[0]
		serializer = BlogSerializer(data=request.data, instance=post)
		serializer.is_valid(raise_exception=True)
		user = serializer.validated_data.get("user")
		self.check_object_permissions(request=request, obj=user)
		serializer.save()

		return Response({"ok": True, "post": serializer.data}, \
				status=status.HTTP_200_OK)

	def delete(self, request: Request, **kwargs) -> Response:
		self.check_permissions(request=request)
		pk = kwargs.get("pk", None)
		if pk is None:
			return Response({"ok": False, \
					"error_message": "You didn't submit a post id."}, \
						status=status.HTTP_404_NOT_FOUND)

		post = BlogService.filter(pk=pk)
		if not post.exists():
			return Response({"ok": False, \
					"error_message": "Not found the post."}, \
						status=status.HTTP_404_NOT_FOUND)
		
		post = post[0]
		self.check_object_permissions(request=request, obj=post.user)
		post.delete()

		return Response({"ok": True}, status=status.HTTP_200_OK)


class FindUserAPIView(APIView):
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def post(self, request: Request) -> Response:
		"""Find users in the network."""

		self.check_permissions(request=request)
		find_users = UserService.filter_find(request=request)

		if not find_users:
			return Response({"ok": False, "error_message": "Not found users."}, \
					status=status.HTTP_404_NOT_FOUND)
		
		return Response({"ok": True, "users": \
					UserSerializer(find_users, many=True).data}, \
						status=status.HTTP_200_OK)


class SubscriberAPIView(APIView):
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request: Request, pk: int) -> Response:
		self.check_permissions(request=request)
		data = SubscriberService.get_user_status(request=request, pk=pk)

		return Response({"ok": True, "status": data}, status=status.HTTP_200_OK)

	def post(self, request: Request, pk: int) -> Response:
		self.check_permissions(request=request)
		SubscriberService.create(user_id=request.user.id, subscribe_id=pk)

		return Response({"ok": True}, status=status.HTTP_200_OK)

	def delete(self, request: Request, pk: int) -> Response:
		self.check_permissions(request=request)

		resp = SubscriberService.delete_by_option(request=request, pk=pk)
		if resp["ok"]:
			return Response(resp, status=status.HTTP_200_OK)
		return Response(resp, status=status.HTTP_404_NOT_FOUND)


class FriendsAPIView(APIView):
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request: Request, option: str) -> Response:
		self.check_permissions(request=request)
		query = SubscriberService \
			.filter_by_option(pk=request.user.id, option=option, serializer=True)

		if not query:
			return Response({"ok": False, "error_message": "Not found users."}, \
					status=status.HTTP_404_NOT_FOUND)
		
		return Response({"ok": True, "query": query}, status=status.HTTP_200_OK)


class NewsAPIView(APIView):
	serializer_class = BlogSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request: Request, loaded_posts: int) -> Response:
		self.check_permissions(request=request)

		friends = SubscriberService.filter_by_option(pk=request.user.id, \
											option="friends", serializer=False) \
												.only("pk") \
													.values_list("pk", flat=True)
		
		posts = BlogService. \
			filter_by_friends(friends=friends, loaded_posts=loaded_posts)

		if not posts.exists():
			return Response({"ok": False, "error_message": "Not found posts."}, \
					status=status.HTTP_404_NOT_FOUND)
		
		return Response({"ok": True, "posts": BlogSerializer(posts, many=True).data}, \
				status=status.HTTP_200_OK)


class RoomsAPIView(APIView):
	serializer_class = RoomSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request: Request) -> Response:
		self.check_permissions(request=request)
		rooms = RoomService.filter_by_subscriber(pk=request.user.id)

		if not rooms.exists():
			return Response({"ok": False, "error_message": "Not found rooms."}, \
						status=status.HTTP_404_NOT_FOUND)
			
		return Response({"ok": True, "rooms": RoomSerializer(rooms, many=True).data}, \
				status=status.HTTP_200_OK)

	def post(self, request: Request) -> Response:
		self.check_permissions(request=request)
		room = RoomService.create(request=request)

		if not room:
			return Response({"ok": False, "error_message": "Not found room."}, \
					status=status.HTTP_404_NOT_FOUND)

		return Response({"ok": True, "room": RoomSerializer(room).data}, \
				status=status.HTTP_200_OK)


class ChatAPIView(APIView):
	serializer_class = MessageSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request: Request, pk: int) -> Response:
		self.check_permissions(request=request)
		room = RoomService.filter(pk=pk)

		if not room.exists():
			return Response({"ok": False, "error_message": "Not found room."}, \
					status=status.HTTP_404_NOT_FOUND)

		room = room[0]
		creator = RoomCreatorService.filter(pk=room.pk)

		if not creator:
			return Response({"ok": False, "error_message": "Not found room creator."}, \
					status=status.HTTP_404_NOT_FOUND)

		creator = creator[0].creator
		is_creator = creator == request.user

		return Response({
			"ok": True,
			"isCreator": is_creator,
			"room": RoomSerializer(room).data
		}, status=status.HTTP_200_OK)

	def put(self, request: Request, pk: int) -> Response:
		self.check_permissions(request=request)
		room = RoomService.put(pk=pk, request=request)

		if not room:
			return Response({"ok": False, "error_message": "Not found room."}, \
					status=status.HTTP_404_NOT_FOUND)

		return Response({"ok": True}, status=status.HTTP_200_OK)


class MessagesAPIView(APIView):
	serializer_class = MessageSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request: Request, pk: int, loaded_messages: int) -> Response:
		self.check_permissions(request=request)
		messages = MessageService.filter(room_id=pk, loaded_messages=loaded_messages)

		if not messages.exists():
			return Response({"ok": False, "error_message": "Not found messages."}, \
					status=status.HTTP_404_NOT_FOUND)

		return Response({"ok": True, \
				"messages": MessageSerializer(messages, many=True).data}, \
					status=status.HTTP_200_OK)
