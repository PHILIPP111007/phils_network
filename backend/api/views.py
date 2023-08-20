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
			return Response({"ok": False, \
				"error_message": "Not found the post."}, \
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
			return Response({"ok": False, \
		    	"error_message": "Not found users."}, \
				status=status.HTTP_404_NOT_FOUND)
		
		return Response({"ok": True, "users": UserSerializer(find_users, many=True).data}, \
			status=status.HTTP_200_OK)


class SubscriberAPIView(APIView):
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request: Request, pk: int) -> Response:
		self.check_permissions(request=request)
		
		user_1 = SubscriberService.filter(user_id=request.user.id, subscribe_id=pk) \
			.only("pk").exists()
		
		user_2 = SubscriberService.filter(user_id=pk, subscribe_id=request.user.id) \
			.only("pk").exists()

		# If we are friends, I can see his blog.
		if user_1 and user_2:
			data = "is_my_friend"
		elif user_1:
			data = "i_am_subscriber"
		elif user_2:
			data = "he_is_subscriber"
		else:
			data = "no_data"

		return Response({"ok": True, "status": data}, status=status.HTTP_200_OK)

	def post(self, request: Request, pk: int) -> Response:
		self.check_permissions(request=request)
		SubscriberService.create(user_id=request.user.id, subscribe_id=pk)

		return Response({"ok": True}, status=status.HTTP_200_OK)

	def delete(self, request: Request, pk: int) -> Response:
		self.check_permissions(request=request)
		option = request.data.get("option", "")
		subscribe = None

		if option == "delete_friend":
			subscribe = SubscriberService.filter(user_id=request.user.id, subscribe_id=pk)

		elif option == "delete_subscriber":
			subscribe = SubscriberService.filter(user_id=pk, subscribe_id=request.user.id)

		if not subscribe:
			return Response({"ok": False, \
		    	"error_message": "Not found subscriber."}, \
				status=status.HTTP_404_NOT_FOUND)
	
		subscribe = subscribe[0]
		subscribe.delete()

		return Response({"ok": True}, status=status.HTTP_200_OK)


class FriendsAPIView(APIView):
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request: Request, option: str) -> Response:
		self.check_permissions(request=request)
		query = SubscriberService.filter_by_option(pk=request.user.id, option=option, serializer=True)

		if not query:
			return Response({"ok": False, \
		    	"error_message": "Not found users."}, \
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
		
		posts = BlogService.filter_by_friends(friends=friends, loaded_posts=loaded_posts)

		if not posts.exists():
			return Response({"ok": False, \
				"error_message": "Not found posts."}, \
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
			return Response({"ok": False, \
		    	"error_message": "Not found rooms."}, \
				status=status.HTTP_404_NOT_FOUND)
			
		return Response({"ok": True, "rooms": RoomSerializer(rooms, many=True).data}, \
			status=status.HTTP_200_OK)

	def post(self, request: Request) -> Response:
		self.check_permissions(request=request)
		room = RoomService.create(request=request)

		if not room:
			return Response({"ok": False, \
		    	"error_message": "Not found room."}, \
				status=status.HTTP_404_NOT_FOUND)

		return Response({"ok": True, \
			"room": RoomSerializer(room).data}, \
			status=status.HTTP_200_OK)


class ChatAPIView(APIView):
	serializer_class = MessageSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request: Request, pk: int) -> Response:
		self.check_permissions(request=request)
		room = RoomService.filter(pk=pk)

		if not room.exists():
			return Response({"ok": False, \
		    	"error_message": "Not found room."}, \
				status=status.HTTP_404_NOT_FOUND)

		room = room[0]
		creator = RoomCreatorService.filter(pk=room.pk)

		if not creator:
			return Response({"ok": False, \
		    	"error_message": "Not found room creator."}, \
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
			return Response({"ok": False, \
		    	"error_message": "Not found room."}, \
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
			return Response({"ok": False, \
		    	"error_message": "Not found messages."}, \
				status=status.HTTP_404_NOT_FOUND)

		return Response({	
			"ok": True,
			"messages": MessageSerializer(messages, many=True).data,
		}, status=status.HTTP_200_OK)
