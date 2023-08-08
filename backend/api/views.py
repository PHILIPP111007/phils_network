from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication

from .serializers import UserSerializer, BlogSerializer, RoomSerializer, MessageSerializer
from .permissions import IsOwnerOrReadOnly
from .services import UserService, SubscriberService, PostService, RoomCreatorService, RoomService, MessageService


class UserAPIView(APIView):
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsOwnerOrReadOnly, IsAuthenticated)

	def get(self, request, username):
		self.check_permissions(request=request)
		global_user = UserService.filter(pk=request.user.id)[0]
		local_user = UserService.filter_by_username(username=username)
		query = {"global_user": UserSerializer(global_user).data}

		if local_user.exists():
			query["local_user"] = UserSerializer(local_user[0]).data
		
		return Response(query)
	
	def put(self, request, **kwargs):
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
		username = kwargs.get("username", "")
		loaded_posts = kwargs.get("loaded_posts", "")
		posts = PostService.filter_by_username(username=username, loaded_posts=loaded_posts)

		if posts.exists():
			return Response({
				"status": True,
				"posts": BlogSerializer(posts, many=True).data
			})

		return Response({'status': False})
	
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
		self.check_permissions(request=request)
		pk = kwargs.get("pk", "")
		if not pk:
			return Response({"status": False})
		
		instance = PostService.filter(pk=pk)
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

		post = PostService.filter(pk=pk)		
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
		
		# If we are friends, I can see his blog
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
		flag = request.data.get("flag", "")

		if flag == "delete_friend":
			subscribe = SubscriberService.filter(user_id=request.user.id, subscribe_id=pk)

			if subscribe.exists():
				subscribe = subscribe[0]
				subscribe.delete()
			
				return Response({"status": True})

		elif flag == "delete_subscriber":
			subscribe = SubscriberService.filter(user_id=pk, subscribe_id=request.user.id)
			
			if subscribe.exists():
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
		friends = SubscriberService.filter_by_option(pk=request.user.id, option="friends", serializer=False).only("pk").values_list("pk", flat=True)
		posts = PostService.filter_by_friends(friends=friends, loaded_posts=loaded_posts)

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
		room_name = request.data.get("name", "")
		pk_list = request.data.get("subscribers", "")

		room = RoomService.create(room_name=room_name, pk_list=pk_list)		
		RoomCreatorService.create(room=room, creator_id=request.user.id)

		return Response({
			"status": True,
			"room": RoomSerializer(room).data
		})


class ChatAPIView(APIView):
	serializer_class = MessageSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request, pk):
		self.check_permissions(request=request)
		room = RoomService.filter(pk=pk)[0]
		creator = RoomCreatorService.filter(room=room)[0].creator
		is_creator = creator == request.user

		return Response({
			"status": True,
			"room": RoomSerializer(room).data,
			"isCreator": is_creator
		})
	
	def put(self, request, pk):
		self.check_permissions(request=request)
		friends = request.data.get("friends", "")
		subscribers = request.data.get("subscribers", "")
		RoomService.put(pk=pk, friends=friends, subscribers=subscribers)
		
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
