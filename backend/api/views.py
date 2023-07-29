from django.contrib.auth.models import User
from .models import Blog, Subscriber, Room, Message

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication

from .serializers import UserSerializer, BlogSerializer, RoomSerializer, MessageSerializer
from .permissions import IsOwnerOrReadOnly  # custom permission
from backend.settings import POSTS_TO_LOAD


class UserAPIView(APIView):
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsOwnerOrReadOnly, IsAuthenticated)

	def get(self, request, username):
		self.check_permissions(request=request)
		global_user = User.objects.get(username=request.user.username)
		query = {'global_user': UserSerializer(global_user).data}
		try:
			local_user = User.objects.get(username=username)
			query['local_user'] = UserSerializer(local_user).data
		except User.DoesNotExist:
			pass
		return Response(query)
	
	def put(self, request, **kwargs):
		self.check_permissions(request=request)
		user = User.objects.get(username=request.user.username)
		self.check_object_permissions(request=request, obj=user)

		user.first_name = request.data.get('first_name', '')
		user.last_name = request.data.get('last_name', '')
		user.email = request.data.get('email', '')
		user.save()

		return Response({'user': UserSerializer(user).data})


class BlogAPIView(APIView):
	serializer_class = BlogSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsOwnerOrReadOnly, IsAuthenticated)

	def get(self, request, **kwargs):
		self.check_permissions(request=request)
		username = kwargs.get('username')
		loaded_posts = kwargs.get('loaded_posts')

		posts = Blog.objects.filter(user=username)[loaded_posts:loaded_posts + POSTS_TO_LOAD]
		return Response({
			'status': True,
			'posts': BlogSerializer(posts, many=True).data
		})
	
	def post(self, request, **kwargs):
		self.check_permissions(request=request)
		serializer = BlogSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		serializer.save()
		return Response({
			'status': True,
			'post': serializer.data
		})
	
	def put(self, request, **kwargs):
		self.check_permissions(request=request)
		pk = kwargs.get('pk', '')
		if not pk:
			return Response({'status': False})
		
		try:
			instance = Blog.objects.get(pk=pk)
		except Blog.DoesNotExist:
			return Response({'status': False})

		serializer = BlogSerializer(data=request.data, instance=instance)
		serializer.is_valid(raise_exception=True)
		user = serializer.validated_data.get('user')
		self.check_object_permissions(request=request, obj=user)
		serializer.save()
		return Response({
			'status': True,
			'post': serializer.data
		})
	
	def delete(self, request, **kwargs):
		self.check_permissions(request=request)
		pk = kwargs.get('pk')
		if not pk:
			return Response({'status': False})

		try:
			post = Blog.objects.get(pk=pk)
		except Blog.DoesNotExist:
			return Response({'status': False})
		
		self.check_object_permissions(request=request, obj=post.user)
		post.delete()

		return Response({'status': True})


class FindUserAPIView(APIView):
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def post(self, request):
		self.check_permissions(request=request)
		username = request.data.get('username', '')
		if username != "":
			find_users = User.objects.filter(username__icontains=username)
		else:
			result_str = "User.objects"

			first_name = request.data.get("first_name", '')
			if first_name != "":
				result_str += f".filter(first_name__icontains=\"{first_name}\")"

			last_name = request.data.get("last_name", '')
			if last_name != "":
				result_str += f".filter(last_name__icontains=\"{last_name}\")"

			if result_str != "User.objects":
				find_users = eval(result_str)

		if find_users:
			find_users = find_users.exclude(username=request.user.username)
		
			return Response({
				'status': True,
				'users': UserSerializer(find_users, many=True).data
			})
		
		return Response({'status': False})


class SubscriberAPIView(APIView):
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request, username):
		self.check_permissions(request=request)

		query = {}
		user_1 = Subscriber.objects.filter(user=request.user.username, subscribe=username)
		user_2 = Subscriber.objects.filter(user=username, subscribe=request.user.username)
		# If we are friends, I can see his blog
		if user_1 and user_2:
			query["status"] = 'is_my_friend'
		elif user_1:
			query["status"] = 'i_am_subscriber'
		elif user_2:
			query["status"] = 'he_is_subscriber'
		else:
			query["status"] = 'no_data'
		return Response(query)

	# add friend
	def post(self, request, username):
		self.check_permissions(request=request)

		if not Subscriber.objects.filter(user=request.user.username, subscribe=username).count():
			subscribe = User.objects.get(username=username)
			Subscriber.objects.create(user=request.user, subscribe=subscribe)
		
			return Response({'status': True})
		return Response({'status': False})

	# delete friend
	def delete(self, request, username):
		self.check_permissions(request=request)

		flag = request.data.get('flag', '')
		if flag == 'delete_friend':
			try:
				subscribe = Subscriber.objects.get(subscribe=username, user=request.user.username)
				subscribe.delete()
				return Response({'status': True})
			except Subscriber.DoesNotExist:
				pass
		elif flag == 'delete_subscriber':
			try:
				subscribe = Subscriber.objects.get(subscribe=request.user.username, user=username)
				subscribe.delete()
				return Response({"status": True})
			except Subscriber.DoesNotExist:
				pass
		return Response({'status': False})


class FriendsAPIView(APIView):
	serializer_class = UserSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request, option):
		self.check_permissions(request=request)

		if option == 'friends':
			query = Subscriber.get_friends(username=request.user.username)
			return Response({
				'status': True,
				'query': UserSerializer(query, many=True).data
			})
		elif option == 'subscriptions':
			query = Subscriber.get_subscriptions(username=request.user.username)
			return Response({
				'status': True,
				'query': UserSerializer(query, many=True).data
			})
		elif option == 'subscribers':
			query = Subscriber.get_subscribers(username=request.user.username)
			return Response({
				'status': True,
				'query': UserSerializer(query, many=True).data
			})
		elif option == 'subscribers_count':
			query = Subscriber.get_subscribers(username=request.user.username).count()
			return Response({
				'status': True,
				'query': query
			})
		
		return Response({'status': False})


class NewsAPIView(APIView):
	serializer_class = BlogSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request, loaded_posts):
		self.check_permissions(request=request)

		friends = Subscriber.get_friends(username=request.user.username)
		posts = Blog.objects.filter(user_id__in=friends)[loaded_posts:loaded_posts + POSTS_TO_LOAD]

		return Response({
			'status': True,
			'posts': BlogSerializer(posts, many=True).data
		})


class RoomsAPIView(APIView):
	serializer_class = RoomSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request):
		self.check_permissions(request=request)

		rooms = Room.objects.filter(subscribers__username=request.user.username)

		return Response({
			'status': True,
			'rooms': RoomSerializer(rooms, many=True).data
		})
	
	def post(self, request):
		self.check_permissions(request=request)

		usernames = request.data.get('subscribers', '')
		name = request.data.get('name', '')
		users = User.objects.filter(username__in=usernames).values_list('pk', flat=True)

		room = Room(name=name)
		room.save()
		room.subscribers.add(*users)

		return Response({
			'status': True,
			'room': RoomSerializer(room).data
		})


class ChatAPIView(APIView):
	serializer_class = MessageSerializer
	authentication_classes = (TokenAuthentication, )
	permission_classes = (IsAuthenticated, )

	def get(self, request, room):
		self.check_permissions(request=request)

		messages = Message.objects.filter(room=room)

		return Response({
			'status': True,
			'messages': MessageSerializer(messages, many=True).data
		})


	




