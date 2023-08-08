from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication

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

	def get(self, request, username):
		"""
		Global user for upper line of the app.
		Local user for user card and posts.
		"""

		self.check_permissions(request=request)
		global_user = UserService.filter(pk=request.user.id)[0]
		local_user = UserService.filter_by_username(username=username)
		query = {"global_user": UserSerializer(global_user).data}

		if local_user.exists():
			query["local_user"] = UserSerializer(local_user[0]).data

		return Response(query)

	def put(self, request, **kwargs):
		"""Updating user info."""

		self.check_permissions(request=request)
		user = UserService.filter(pk=request.user.id)[0]
		self.check_object_permissions(request=request, obj=user)
		user = UserService.put(user=user, request=request)

		return Response({"user": UserSerializer(user).data})

	def delete(self, request, **kwargs):
		self.check_permissions(request=request)
		user = UserService.filter(pk=request.user.id)[0]
		self.check_object_permissions(request=request, obj=user)
		user.delete()

		return Response({"status": True})


class BlogAPIView(APIView):
	serializer_class = BlogSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsOwnerOrReadOnly, IsAuthenticated)

	def get(self, request, **kwargs):
		self.check_permissions(request=request)
		posts = BlogService.filter_by_username(**kwargs)

		if posts.exists():
			return Response({
				"status": True,
				"posts": BlogSerializer(posts, many=True).data
			})

		return Response({"status": False})

	def post(self, request, **kwargs):
		self.check_permissions(request=request)
		serializer = BlogSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		serializer.save()

		return Response({
			"status": True,
			"post": serializer.data
		})

	def put(self, request, **kwargs):
		"""Update post text."""
		
		self.check_permissions(request=request)
		pk = kwargs.get("pk", "")
		if not pk:
			return Response({"status": False})

		instance = BlogService.filter(pk=pk)
		if not instance.exists():
			return Response({"status": False})

		instance = instance[0]
		serializer = BlogSerializer(data=request.data, instance=instance)
		serializer.is_valid(raise_exception=True)
		user = serializer.validated_data.get("user")
		self.check_object_permissions(request=request, obj=user)
		serializer.save()

		return Response({
			"status": True,
			"post": serializer.data
		})

	def delete(self, request, **kwargs):
		self.check_permissions(request=request)
		pk = kwargs.get("pk", "")
		if not pk:
			return Response({"status": False})

		post = BlogService.filter(pk=pk)
		if post.exists():
			post = post[0]
			self.check_object_permissions(request=request, obj=post.user)
			post.delete()
			return Response({"status": True})

		return Response({"status": False})


class FindUserAPIView(APIView):
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def post(self, request):
		"""Find users in the network."""

		self.check_permissions(request=request)
		find_users = UserService.filter_find(request=request)

		if find_users:
			return Response({
				"status": True,
				"users": UserSerializer(find_users, many=True).data
			})

		return Response({"status": False})

class SubscriberAPIView(APIView):
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request, pk):
		self.check_permissions(request=request)
		user_1 = SubscriberService.filter(user_id=request.user.id, subscribe_id=pk).only("pk").exists()
		user_2 = SubscriberService.filter(user_id=pk, subscribe_id=request.user.id).only("pk").exists()

		# If we are friends, I can see his blog.
		if user_1 and user_2:
			return Response({"status": "is_my_friend"})
		elif user_1:
			return Response({"status": "i_am_subscriber"})
		elif user_2:
			return Response({"status": "he_is_subscriber"})

		return Response({"status": "no_data"})

	def post(self, request, pk):
		self.check_permissions(request=request)
		SubscriberService.create(user_id=request.user.id, subscribe_id=pk)

		return Response({"status": True})

	def delete(self, request, pk):
		self.check_permissions(request=request)
		option = request.data.get("option", "")
		subscribe = None

		if option == "delete_friend":
			subscribe = SubscriberService.filter(user_id=request.user.id, subscribe_id=pk)

		elif option == "delete_subscriber":
			subscribe = SubscriberService.filter(user_id=pk, subscribe_id=request.user.id)

		if subscribe:
			subscribe = subscribe[0]
			subscribe.delete()

			return Response({"status": True})

		return Response({"status": False})


class FriendsAPIView(APIView):
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request, option):
		self.check_permissions(request=request)
		query = SubscriberService.filter_by_option(pk=request.user.id, option=option, serializer=True)

		if query:
			return Response({
				"status": True,
				"query": query
			})

		return Response({"status": False})


class NewsAPIView(APIView):
	serializer_class = BlogSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request, loaded_posts):
		self.check_permissions(request=request)
		friends = SubscriberService.filter_by_option(pk=request.user.id, option="friends", serializer=False) \
			.only("pk") \
			.values_list("pk", flat=True)
		
		posts = BlogService.filter_by_friends(friends=friends, loaded_posts=loaded_posts)

		return Response({
			"status": True,
			"posts": BlogSerializer(posts, many=True).data
		})


class RoomsAPIView(APIView):
	serializer_class = RoomSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request):
		self.check_permissions(request=request)
		rooms = RoomService.filter_by_subscriber(pk=request.user.id)

		return Response({
			"status": True,
			"rooms": RoomSerializer(rooms, many=True).data
		})

	def post(self, request):
		self.check_permissions(request=request)
		room = RoomService.create(request=request)

		if room:
			RoomCreatorService.create(room_id=room.id, creator_id=request.user.id)

			return Response({
				"status": True,
				"room": RoomSerializer(room).data
			})
		
		return Response({"status": False})


class ChatAPIView(APIView):
	serializer_class = MessageSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request, pk):
		self.check_permissions(request=request)
		room = RoomService.filter(pk=pk)[0]
		creator = RoomCreatorService.filter(pk=room.pk)[0].creator
		is_creator = creator == request.user

		return Response({
			"status": True,
			"room": RoomSerializer(room).data,
			"isCreator": is_creator
		})

	def put(self, request, pk):
		self.check_permissions(request=request)
		RoomService.put(pk=pk, request=request)

		return Response({"status": True})


class MessagesAPIView(APIView):
	serializer_class = MessageSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request, pk, loaded_messages):
		self.check_permissions(request=request)
		messages = MessageService.filter(room_id=pk, loaded_messages=loaded_messages)

		if messages.exists():
			return Response({
				"status": True,
				"messages": MessageSerializer(messages, many=True).data,
			})

		return Response({"status": False})
