from rest_framework.views import APIView
from rest_framework.response import Response
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

	def get(self, request, username: str):
		"""
		Global user for upper line of the app.
		Local user for user card and posts.
		"""

		self.check_permissions(request=request)
		global_user = UserService.filter(pk=request.user.id)

		if global_user.exists():
			query = {"global_user": UserSerializer(global_user[0]).data}
			local_user = UserService.filter_by_username(username=username)

			if local_user.exists():
				query["local_user"] = UserSerializer(local_user[0]).data

			return Response(query, status=status.HTTP_200_OK)

		return Response(status=status.HTTP_404_NOT_FOUND)

	def put(self, request, **kwargs):
		"""Updating user info."""

		self.check_permissions(request=request)
		user = UserService.filter(pk=request.user.id)

		if user.exists():
			user = user[0]
			self.check_object_permissions(request=request, obj=user)
			user = UserService.put(user=user, request=request)

			return Response({"user": UserSerializer(user).data}, status=status.HTTP_200_OK)
		return Response(status=status.HTTP_404_NOT_FOUND)

	def delete(self, request, **kwargs):
		self.check_permissions(request=request)
		user = UserService.filter(pk=request.user.id)

		if user.exists():
			user = user[0]
			self.check_object_permissions(request=request, obj=user)
			user.delete()

			return Response({"status": True}, status=status.HTTP_200_OK)
		return Response(status=status.HTTP_404_NOT_FOUND)


class BlogAPIView(APIView):
	serializer_class = BlogSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsOwnerOrReadOnly, IsAuthenticated)

	def get(self, request, **kwargs):
		self.check_permissions(request=request)
		posts = BlogService.filter_by_username(**kwargs)

		if posts.exists():

			return Response({
				"posts": BlogSerializer(posts, many=True).data
			}, status=status.HTTP_200_OK)

		return Response(status=status.HTTP_404_NOT_FOUND)

	def post(self, request, **kwargs):
		self.check_permissions(request=request)
		serializer = BlogSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		serializer.save()

		return Response({"post": serializer.data}, status=status.HTTP_200_OK)

	def put(self, request, **kwargs):
		"""Update post text."""

		self.check_permissions(request=request)
		pk = kwargs.get("pk", "")
		if not pk:
			return Response(status=status.HTTP_404_NOT_FOUND)

		instance = BlogService.filter(pk=pk)
		if not instance.exists():
			return Response(status=status.HTTP_404_NOT_FOUND)

		instance = instance[0]
		serializer = BlogSerializer(data=request.data, instance=instance)
		serializer.is_valid(raise_exception=True)
		user = serializer.validated_data.get("user")
		self.check_object_permissions(request=request, obj=user)
		serializer.save()

		return Response({"post": serializer.data}, status=status.HTTP_200_OK)

	def delete(self, request, **kwargs):
		self.check_permissions(request=request)
		pk = kwargs.get("pk", "")
		if not pk:
			return Response(status=status.HTTP_404_NOT_FOUND)

		post = BlogService.filter(pk=pk)

		if post.exists():
			post = post[0]
			self.check_object_permissions(request=request, obj=post.user)
			post.delete()

			return Response({"status": True}, status=status.HTTP_200_OK)
		return Response(status=status.HTTP_404_NOT_FOUND)


class FindUserAPIView(APIView):
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def post(self, request):
		"""Find users in the network."""

		self.check_permissions(request=request)
		find_users = UserService.filter_find(request=request)

		if find_users:
			return Response({"users": UserSerializer(find_users, many=True).data}, \
				status=status.HTTP_200_OK)

		return Response(status=status.HTTP_404_NOT_FOUND)

class SubscriberAPIView(APIView):
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request, pk: int):
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

		return Response({"status": data}, status=status.HTTP_200_OK)

	def post(self, request, pk: int):
		self.check_permissions(request=request)
		SubscriberService.create(user_id=request.user.id, subscribe_id=pk)

		return Response({"status": True}, status=status.HTTP_200_OK)

	def delete(self, request, pk: int):
		self.check_permissions(request=request)
		option = request.data.get("option", "")
		subscribe = None

		if option == "delete_friend":
			subscribe = SubscriberService.filter(user_id=request.user.id, subscribe_id=pk)

		elif option == "delete_subscriber":
			subscribe = SubscriberService.filter(user_id=pk, subscribe_id=request.user.id)

		if subscribe.exists():
			subscribe = subscribe[0]
			subscribe.delete()

			return Response({"status": True}, status=status.HTTP_200_OK)
		return Response(status=status.HTTP_404_NOT_FOUND)


class FriendsAPIView(APIView):
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request, option: str):
		self.check_permissions(request=request)
		query = SubscriberService.filter_by_option(pk=request.user.id, option=option, serializer=True)

		if query:
			return Response({"query": query}, status=status.HTTP_200_OK)
		return Response(status=status.HTTP_404_NOT_FOUND)


class NewsAPIView(APIView):
	serializer_class = BlogSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request, loaded_posts: int):
		self.check_permissions(request=request)
		friends = SubscriberService.filter_by_option(pk=request.user.id, \
			option="friends", serializer=False) \
			.only("pk") \
			.values_list("pk", flat=True)
		
		posts = BlogService.filter_by_friends(friends=friends, loaded_posts=loaded_posts)

		if posts.exists():
			return Response({"posts": BlogSerializer(posts, many=True).data}, \
				status=status.HTTP_200_OK)
		
		return Response(status=status.HTTP_404_NOT_FOUND)


class RoomsAPIView(APIView):
	serializer_class = RoomSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request):
		self.check_permissions(request=request)
		rooms = RoomService.filter_by_subscriber(pk=request.user.id)

		if rooms.exists():
			return Response({"rooms": RoomSerializer(rooms, many=True).data}, \
				status=status.HTTP_200_OK)
		
		return Response({"status": True}, status=status.HTTP_200_OK)

	def post(self, request):
		self.check_permissions(request=request)
		room = RoomService.create(request=request)

		if room:
			return Response({"room": RoomSerializer(room).data}, status=status.HTTP_200_OK)
		return Response(status=status.HTTP_404_NOT_FOUND)


class ChatAPIView(APIView):
	serializer_class = MessageSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request, pk: int):
		self.check_permissions(request=request)
		room = RoomService.filter(pk=pk)

		if room.exists():
			room = room[0]
			creator = RoomCreatorService.filter(pk=room.pk)

			if creator:
				creator = creator[0].creator
				is_creator = creator == request.user

				return Response({
					"isCreator": is_creator,
					"room": RoomSerializer(room).data
				}, status=status.HTTP_200_OK)

		return Response(status=status.HTTP_404_NOT_FOUND)

	def put(self, request, pk: int):
		self.check_permissions(request=request)
		room = RoomService.put(pk=pk, request=request)

		if room:
			return Response({"status": True}, status=status.HTTP_200_OK)
		return Response(status=status.HTTP_404_NOT_FOUND)


class MessagesAPIView(APIView):
	serializer_class = MessageSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request, pk: int, loaded_messages: int):
		self.check_permissions(request=request)
		messages = MessageService.filter(room_id=pk, loaded_messages=loaded_messages)

		if messages.exists():
			return Response({
				"messages": MessageSerializer(messages, many=True).data,
			}, status=status.HTTP_200_OK)

		return Response(status=status.HTTP_404_NOT_FOUND)
