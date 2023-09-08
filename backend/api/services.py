"""
Business logic of the application.
"""

from typing import Callable

from django.conf import settings
from django.db.models.query import QuerySet
from django.db.models import Q, Max
from django.contrib.auth.models import User

from rest_framework.request import Request
from rest_framework.utils.serializer_helpers import ReturnList

from .serializers import UserSerializer
from .models import (
	Subscriber,
	Blog,
	RoomCreator,
	Room,
	Message
)


class SubscriberStatus:
	"""Implements subscriber status."""

	IS_FRIEND = "is_my_friend"
	ME_SUBSCRIBER = "i_am_subscriber"
	HE_SUBSCRIBER = "he_is_subscriber"
	NO_DATA = "no_data"


class UserService:

	@staticmethod
	def filter(pk: int) -> QuerySet[User]:
		return User.objects.filter(pk=pk) \
			.only("username", "first_name", "last_name")

	@staticmethod
	def filter_by_username(username: str) -> QuerySet[User]:
		return User.objects.filter(username=username) \
			.only("username", "first_name", "last_name")

	# TODO: Change this weak method
	@staticmethod
	def filter_find(request: Request) -> QuerySet[User] | User | None:
		"""Find users in the network."""

		username: str | None = request.data.get("username", None)
		find_users = None
		if username:
			find_users = User.objects.filter(username__icontains=username) \
				.only("username", "first_name", "last_name")
		else:
			query = "User.objects"
			first_name: str | None = request.data.get("first_name", None)
			last_name: str | None = request.data.get("last_name", None)

			if first_name:
				query += f".filter(first_name__icontains=\"{first_name}\")"

			if last_name:
				query += f".filter(last_name__icontains=\"{last_name}\")"

			if query != "User.objects":
				query += ".only(\"username\", \"first_name\", \"last_name\")"
				find_users = eval(query)

		if find_users:
			find_users = find_users.exclude(pk=request.user.id)

		return find_users

	@staticmethod
	def put(user: User, request: Request) -> User:
		"""
		Updating user info.
		User can update first name, last name and email.
		Email can be deleted.
		"""

		first_name: str | None = request.data.get("first_name", None)
		last_name: str | None = request.data.get("last_name", None)
		email: str | None = request.data.get("email", None)

		if first_name:
			user.first_name = first_name
		if last_name:
			user.last_name = last_name

		user.email = email
		user.save()
		return user


class SubscriberService:

	@staticmethod
	def _get_subscribers_sets(pk: int) -> \
		tuple[QuerySet[Subscriber], QuerySet[Subscriber]]:

		set_1 = Subscriber.objects.filter(user_id=pk) \
			.only("subscribe").values_list("subscribe", flat=True)
		
		set_2 = Subscriber.objects.filter(subscribe_id=pk) \
			.only("user").values_list("user", flat=True)

		return set_1, set_2

	@staticmethod
	def _get_friends(pk: int) -> QuerySet[User]:
		set_1, set_2 = SubscriberService._get_subscribers_sets(pk=pk)

		query = User.objects.filter(
			Q(pk__in=set_1) & Q(pk__in=set_2)
		).only("username", "first_name", "last_name")

		return query
	
	@staticmethod
	def _get_subscriptions(pk: int) -> QuerySet[User]:
		set_1, set_2 = SubscriberService._get_subscribers_sets(pk=pk)

		query = User.objects.filter(
			Q(pk__in=set_1) & ~Q(pk__in=set_2)
		).only("username", "first_name", "last_name")

		return query
	
	@staticmethod
	def _get_subscribers(pk: int) -> QuerySet[User]:
		set_1, set_2 = SubscriberService._get_subscribers_sets(pk=pk)

		query = User.objects.filter(
			Q(pk__in=set_2) & ~Q(pk__in=set_1)
		).only("username", "first_name", "last_name")

		return query

	@staticmethod
	def filter(user_id: int, subscribe_id: int) -> QuerySet[Subscriber]:
		return Subscriber.objects.filter(user_id=user_id, subscribe_id=subscribe_id)

	@staticmethod
	def filter_by_option(pk: int, option: str, serializer: bool = True) \
		-> QuerySet[User] | ReturnList | int | None:
		"""
		Returns subscribers count or
		list of friends / subscriptions / subscribers.
		"""

		options = {
			"friends": lambda pk: SubscriberService._get_friends(pk=pk),
			"subscriptions": lambda pk: SubscriberService._get_subscriptions(pk=pk),
			"subscribers": lambda pk: SubscriberService._get_subscribers(pk=pk),
			"subscribers_count": lambda pk: SubscriberService \
				._get_subscribers(pk=pk).count()
		}

		option_func: Callable[[int], QuerySet[User] | int] | None = \
			options.get(option, None)

		if option_func:
			query = option_func(pk)
			if serializer and not isinstance(query, int):
				query = UserSerializer(query, many=True).data
			return query
		return None

	@staticmethod
	def create(user_id: int, subscribe_id: int) -> None:
		Subscriber.objects.get_or_create(user_id=user_id, subscribe_id=subscribe_id)
	
	@staticmethod
	def delete_by_option(request: Request, pk: int) -> \
		dict[str, bool | str] | dict[str, bool]:
		
		option: str | None = request.data.get("option", None)
		if not option:
			return {"ok": False, "error_message": "Not provided an option."}

		subscribe = None
		if option == "delete_friend":
			subscribe = SubscriberService \
				.filter(user_id=request.user.id, subscribe_id=pk)
		elif option == "delete_subscriber":
			subscribe = SubscriberService \
				.filter(user_id=pk, subscribe_id=request.user.id)

		if not subscribe:
			return {"ok": False, "error_message": "Not found subscriber."}
	
		subscribe = subscribe[0]
		subscribe.delete()

		return {"ok": True}
	
	@staticmethod
	def get_user_status(request: Request, pk: int):

		user_1 = SubscriberService.filter(user_id=request.user.id, subscribe_id=pk) \
			.only("pk").exists()

		user_2 = SubscriberService.filter(user_id=pk, subscribe_id=request.user.id) \
			.only("pk").exists()

		# If we are friends, I can see his blog.
		if user_1 and user_2:
			return SubscriberStatus.IS_FRIEND
		elif user_1:
			return SubscriberStatus.ME_SUBSCRIBER
		elif user_2:
			return SubscriberStatus.HE_SUBSCRIBER
		else:
			return SubscriberStatus.NO_DATA


class BlogService:

	@staticmethod
	def filter(pk: int) -> QuerySet[Blog]:
		return Blog.objects.filter(pk=pk)

	@staticmethod
	def filter_by_username(**kwargs: dict) -> QuerySet[Blog]:
		"""Lazy loading of posts on the user page."""

		username: str | None = kwargs.get("username", None)
		loaded_posts: int | None = kwargs.get("loaded_posts", None)

		posts = Blog.objects.filter(user_id__username=username) \
			.select_related("user") \
				.only(
					"content",
					"timestamp",
					"changed",
					"user__username",
					"user__first_name",
					"user__last_name"
				)[loaded_posts:loaded_posts + settings.POSTS_TO_LOAD]

		return posts

	@staticmethod
	def filter_by_friends(friends: list, loaded_posts: int) -> QuerySet[Blog]:
		"""Lazy loading of posts on the news page."""

		posts = Blog.objects.filter(user_id__in=friends) \
			.select_related("user") \
				.only(
					"content",
					"timestamp",
					"changed",
					"user__username",
					"user__first_name",
					"user__last_name"
				)[loaded_posts:loaded_posts + settings.POSTS_TO_LOAD]

		return posts


class RoomCreatorService:

	@staticmethod
	def filter(pk: int) -> QuerySet[RoomCreator]:
		return RoomCreator.objects.filter(room_id=pk).select_related("creator")


class RoomService:

	@staticmethod
	def get(pk: int) -> Room:
		return Room.objects.get(pk=pk)

	@staticmethod
	def filter(pk: int) -> QuerySet[Room]:
		return Room.objects.filter(pk=pk).prefetch_related("subscribers")

	@staticmethod
	def filter_by_subscriber(pk: int) -> QuerySet[Room]:
		"""Return Rooms ordered by last messages timestamp."""

		rooms = Room.objects.filter(subscribers=pk) \
			.annotate(last_message=Max("message__timestamp")) \
				.order_by("-last_message") \
					.prefetch_related("subscribers")

		return rooms

	@staticmethod
	def put(pk: int, request: Request) -> Room | None:
		"""
		Update room subscribers.
		If their number is zero, the room will be deleted.
		"""

		friends: list | None = request.data.get("friends", None)
		subscribers: list | None = request.data.get("subscribers", None)

		room = Room.objects.filter(pk=pk)
		if room.exists():
			room = room[0]

			if friends:
				room.subscribers.add(*friends)
			
			if subscribers:
				room.subscribers.remove(*subscribers)

			if not room.subscribers.exists():
				room.delete()
			
			return room
		return None

	@staticmethod
	def create(request: Request) -> Room | None:
		room_name: str | None = request.data.get("name", None)
		pk_list: list[int] | None = request.data.get("subscribers", None)

		if room_name:
			room = Room(name=room_name)
			room.save()

			if pk_list:
				subscribers = User.objects.filter(pk__in=pk_list).only("pk") \
					.values_list("pk", flat=True)

				if subscribers:
					room.subscribers.add(*subscribers)

			RoomCreator.objects \
				.get_or_create(room_id=room.id, creator_id=request.user.id)

			return room
		return None


class MessageService:

	@staticmethod
	def filter(room_id: int, loaded_messages: int) -> QuerySet[Message]:
		"""Lazy loading of messages for room."""

		messages = Message.objects.filter(room_id=room_id) \
			.select_related("sender") \
			.only(
				"text",
				"timestamp",
				"sender__username",
				"sender__first_name",
				"sender__last_name"
			)[loaded_messages:loaded_messages + settings.MESSAGES_TO_LOAD]

		return messages

	@staticmethod
	def create(room_id: int, sender_id: int, text: str) -> Message:
		return Message.objects.create(room_id=room_id, sender_id=sender_id, text=text)

	@staticmethod
	def check_permission(room_id: int, subscriber_id: int) -> bool:
		"""Check if user is the Room subscriber."""

		room = Room.objects.get(pk=room_id)
		flag = room.subscribers.filter(pk=subscriber_id).exists()

		return flag
