from django.conf import settings

from .models import *
from .serializers import UserSerializer


class UserService:

	@staticmethod
	def filter(pk):
		return User.objects.filter(pk=pk).only("username", "first_name", "last_name")

	@staticmethod
	def filter_by_username(username):
		return User.objects.filter(username=username).only("username", "first_name", "last_name")

	@staticmethod
	def filter_find(request):
		username = request.data.get("username", "")
		find_users = None
		if username:
			find_users = User.objects.filter(username__icontains=username).only("username", "first_name", "last_name")
		else:
			query = "User.objects"
			first_name = request.data.get("first_name", "")
			last_name = request.data.get("last_name", "")

			if first_name:
				query += f".filter(first_name__icontains=\"{first_name}\")"

			if last_name:
				query += f".filter(last_name__icontains=\"{last_name}\")"

			if query != "User.objects":
				query += '.only("username", "first_name", "last_name")'
				find_users = eval(query)

		if find_users:
			find_users = find_users.exclude(pk=request.user.id)

		return find_users
	
	@staticmethod
	def put(user, request):
		first_name = request.data.get("first_name", "")
		last_name = request.data.get("last_name", "")
		email = request.data.get("email", "")

		if first_name:
			user.first_name = first_name
		
		if last_name:
			user.last_name = last_name
		user.email = email
		user.save()

		return user


class SubscriberService:

	@staticmethod
	def filter(user_id, subscribe_id):
		return Subscriber.objects.filter(user_id=user_id, subscribe_id=subscribe_id)
	
	@staticmethod
	def filter_by_option(pk, option, serializer=True):
		options = {
			"friends": lambda: Subscriber.get_friends(pk=pk),
			"subscriptions": lambda: Subscriber.get_subscriptions(pk=pk),
			"subscribers": lambda: Subscriber.get_subscribers(pk=pk),
			"subscribers_count": lambda: Subscriber.get_subscribers(pk=pk).count()
		}

		if options.get(option, ""):
			query = options[option]()

			if serializer and not isinstance(query, int):
				query = UserSerializer(query, many=True).data

			return query
		
		return None

	@staticmethod
	def create(user_id, subscribe_id):
		Subscriber.objects.get_or_create(user_id=user_id, subscribe_id=subscribe_id)



class PostService:

	@staticmethod
	def filter(pk):
		return Blog.objects.filter(pk=pk)
	
	@staticmethod
	def filter_by_username(username, loaded_posts):
		posts = Blog.objects.filter(user_id__username=username).select_related("user") \
			.only("content", "timestamp", "changed", "user__username", "user__first_name", "user__last_name") \
			[loaded_posts:loaded_posts + settings.POSTS_TO_LOAD]
		
		return posts

	@staticmethod
	def filter_by_friends(friends, loaded_posts):
		posts = Blog.objects.filter(user_id__in=friends).select_related("user") \
			.only("content", "timestamp", "changed", "user__username", "user__first_name", "user__last_name") \
			[loaded_posts:loaded_posts + settings.POSTS_TO_LOAD]
		
		return posts


class RoomCreatorService:

	@staticmethod
	def filter(room):
		return RoomCreator.objects.filter(room=room).select_related('creator')
	
	@staticmethod
	def create(room, creator_id):
		RoomCreator.objects.get_or_create(room=room, creator_id=creator_id)


class RoomService:

	@staticmethod
	def get(pk):
		return Room.objects.get(pk=pk)
	
	@staticmethod
	def filter(pk):
		return Room.objects.filter(pk=pk).prefetch_related("subscribers")
	
	@staticmethod
	def filter_by_subscriber(pk):
		return Room.objects.filter(subscribers=pk).prefetch_related("subscribers")
	
	@staticmethod
	def put(pk, friends, subscribers):
		room = Room.objects.get(pk=pk)
		room.subscribers.add(*friends)
		room.subscribers.remove(*subscribers)

		if not room.subscribers.exists():
			room.delete()

	@staticmethod
	def create(room_name, pk_list):
		subscribers = User.objects.filter(pk__in=pk_list).only("pk").values_list("pk", flat=True)
		room = Room(name=room_name)
		room.save()
		room.subscribers.add(*subscribers)

		return room
	

class MessageService:

	@staticmethod
	def filter(room_id, loaded_messages):
		messages = Message.objects.filter(room_id=room_id).select_related("sender") \
			.only("text", "timestamp", "sender__username", "sender__first_name", "sender__last_name") \
			[loaded_messages:loaded_messages + settings.MESSAGES_TO_LOAD]
		
		return messages
