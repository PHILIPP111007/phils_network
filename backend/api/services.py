"""
Business logic of the application.
"""

from typing import Callable
from .enums import SubscriberStatus, DeleteOption, FilterOption

from django.conf import settings
from django.db.models.query import QuerySet
from django.db.models import Q, Subquery, OuterRef
from django.contrib.auth.models import User

from rest_framework.request import Request
from rest_framework.utils.serializer_helpers import ReturnList

from .serializers import UserSerializer
from .models import Subscriber, Blog, RoomCreator, Room, Message


class UserService:
	@staticmethod
	def filter(pk: int) -> QuerySet[User]:
		return User.objects.filter(pk=pk).only("username", "first_name", "last_name")

	@staticmethod
	def filter_by_username(username: str) -> QuerySet[User]:
		return User.objects.filter(username=username).only(
			"username", "first_name", "last_name"
		)

	@staticmethod
	def filter_find(request: Request) -> QuerySet[User] | User | None:
		"""Find users in the network."""

		username: str | None = request.data.get("username", None)

		if username:
			query_full = (
				User.objects.filter(username__icontains=username)
				.only("username", "first_name", "last_name")
				.exclude(pk=request.user.pk)
			)
			return query_full

		else:
			first_name: str | None = request.data.get("first_name", None)
			last_name: str | None = request.data.get("last_name", None)

			if not (first_name or last_name):
				return

			if first_name:
				query_1 = User.objects.filter(first_name__icontains=first_name)
			if last_name:
				query_2 = User.objects.filter(last_name__icontains=last_name)

			if first_name and last_name:
				query_full = query_1 & query_2
			elif first_name:
				query_full = query_1
			elif last_name:
				query_full = query_2

			query_full = query_full.only("username", "first_name", "last_name").exclude(
				pk=request.user.pk
			)

			return query_full

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
	def _get_subscribers_sets(
		pk: int
	) -> tuple[QuerySet[Subscriber], QuerySet[Subscriber]]:
		set_1 = Subquery(
			Subscriber.objects.filter(user_id=pk)
			.only("subscribe")
			.values_list("subscribe", flat=True)
		)

		set_2 = Subquery(
			Subscriber.objects.filter(subscribe_id=pk)
			.only("user")
			.values_list("user", flat=True)
		)

		return set_1, set_2

	@classmethod
	def _get_friends(cls, pk: int) -> QuerySet[User]:
		set_1, set_2 = cls._get_subscribers_sets(pk=pk)

		query = User.objects.filter(Q(pk__in=set_1) & Q(pk__in=set_2)).only(
			"username", "first_name", "last_name"
		)

		return query

	@classmethod
	def _get_subscriptions(cls, pk: int) -> QuerySet[User]:
		set_1, set_2 = cls._get_subscribers_sets(pk=pk)

		query = User.objects.filter(Q(pk__in=set_1) & ~Q(pk__in=set_2)).only(
			"username", "first_name", "last_name"
		)

		return query

	@classmethod
	def _get_subscribers(cls, pk: int) -> QuerySet[User]:
		set_1, set_2 = cls._get_subscribers_sets(pk=pk)

		query = User.objects.filter(Q(pk__in=set_2) & ~Q(pk__in=set_1)).only(
			"username", "first_name", "last_name"
		)

		return query

	@staticmethod
	def filter(user_id: int, subscribe_id: int) -> QuerySet[Subscriber]:
		return Subscriber.objects.filter(user_id=user_id, subscribe_id=subscribe_id)

	@classmethod
	def filter_by_option(
		cls, pk: int, option: int, serializer: bool = True
	) -> QuerySet[User] | ReturnList | int | None:
		"""
		Returns subscribers count or
		list of friends / subscriptions / subscribers.
		"""

		options = {
			FilterOption.FRIENDS.value: lambda pk: cls._get_friends(pk=pk),
			FilterOption.SUBSCRIPTIONS.value: lambda pk: cls._get_subscriptions(pk=pk),
			FilterOption.SUBSCRIBERS.value: lambda pk: cls._get_subscribers(pk=pk),
			FilterOption.SUBSCRIBERS_COUNT.value: lambda pk: cls._get_subscribers(
				pk=pk
			).count(),
		}

		option_func: Callable[[int], QuerySet[User] | int] | None = options.get(
			option, None
		)

		if option_func:
			query = option_func(pk)
			if serializer and not isinstance(query, int):
				query = UserSerializer(query, many=True).data
			return query
		return None

	@staticmethod
	def create(user_id: int, subscribe_id: int) -> None:
		Subscriber.objects.get_or_create(user_id=user_id, subscribe_id=subscribe_id)

	@classmethod
	def delete_by_option(
		cls, request: Request, pk: int
	) -> dict[str, bool | str] | dict[str, bool]:
		option: int | None = int(request.data.get("option", None))
		if not option:
			return {"ok": False, "error_message": "Not provided an option."}

		subscribe = None
		if option == DeleteOption.DELETE_FRIEND.value:
			subscribe = cls.filter(user_id=request.user.pk, subscribe_id=pk).first()
		elif option == DeleteOption.DELETE_SUBSCRIBER.value:
			subscribe = cls.filter(user_id=pk, subscribe_id=request.user.pk).first()

		if subscribe is None:
			return {"ok": False, "error_message": "Not found subscriber."}

		subscribe.delete()
		return {"ok": True}

	@classmethod
	def get_user_status(cls, request: Request, pk: int):
		user_1 = (
			cls.filter(user_id=request.user.pk, subscribe_id=pk).only("pk").exists()
		)

		user_2 = (
			cls.filter(user_id=pk, subscribe_id=request.user.pk).only("pk").exists()
		)

		# If we are friends, I can see his blog.
		if user_1 and user_2:
			return SubscriberStatus.IS_FRIEND.value
		elif user_1:
			return SubscriberStatus.ME_SUBSCRIBER.value
		elif user_2:
			return SubscriberStatus.HE_SUBSCRIBER.value
		else:
			return SubscriberStatus.NO_DATA.value


class BlogService:
	@staticmethod
	def filter(pk: int) -> QuerySet[Blog]:
		return Blog.objects.filter(pk=pk)

	@staticmethod
	def filter_by_username(**kwargs: dict) -> QuerySet[Blog]:
		"""Lazy loading of posts on the user page."""

		username: str | None = kwargs.get("username", None)
		loaded_posts: int | None = kwargs.get("loaded_posts", None)

		posts = (
			Blog.objects.filter(user_id__username=username)
			.select_related("user")
			.only(
				"content",
				"timestamp",
				"changed",
				"user__username",
				"user__first_name",
				"user__last_name",
			)[loaded_posts : loaded_posts + settings.POSTS_TO_LOAD]
		)

		return posts

	@staticmethod
	def filter_by_friends(friends: list, loaded_posts: int) -> QuerySet[Blog]:
		"""Lazy loading of posts on the news page."""

		posts = (
			Blog.objects.filter(user_id__in=friends)
			.select_related("user")
			.only(
				"content",
				"timestamp",
				"changed",
				"user__username",
				"user__first_name",
				"user__last_name",
			)[loaded_posts : loaded_posts + settings.POSTS_TO_LOAD]
		)

		return posts


class RoomCreatorService:
	@staticmethod
	def filter(pk: int) -> QuerySet[RoomCreator]:
		return (
			RoomCreator.objects.filter(room_id=pk)
			.select_related("creator")
			.only("creator__username")
		)


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

		last_message = Message.objects.filter(room_id=OuterRef("pk")).only(
			"sender", "timestamp", "text"
		)[:1]

		rooms = (
			Room.objects.filter(subscribers=pk)
			.annotate(
				last_message_sender=Subquery(last_message.values("sender__username")),
				last_message_timestamp=Subquery(last_message.values("timestamp")),
				last_message_text=Subquery(last_message.values("text")),
			)
			.order_by("-last_message_timestamp")
			.prefetch_related("subscribers")
		)

		return rooms

	@staticmethod
	def put(pk: int, request: Request) -> Room | None:
		"""
		Update room subscribers.
		If their number is zero, the room will be deleted.
		"""

		friends: list | None = request.data.get("friends", None)
		subscribers: list | None = request.data.get("subscribers", None)

		room = Room.objects.filter(pk=pk).first()
		if room is not None:
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
		if room_name is None:
			return None

		pk_list: list[int] | None = request.data.get("subscribers", None)
		room = Room(name=room_name)
		room.save()

		if pk_list:
			subscribers = (
				User.objects.filter(pk__in=pk_list)
				.only("pk")
				.values_list("pk", flat=True)
			)

			if subscribers:
				room.subscribers.add(*subscribers)

		RoomCreator.objects.get_or_create(room_id=room.pk, creator_id=request.user.pk)

		return room


class MessageService:
	@staticmethod
	def filter(room_id: int, loaded_messages: int) -> QuerySet[Message]:
		"""Lazy loading of messages for room."""

		messages = (
			Message.objects.filter(room_id=room_id)
			.select_related("sender")
			.only(
				"text",
				"timestamp",
				"sender__username",
				"sender__first_name",
				"sender__last_name",
			)[loaded_messages : loaded_messages + settings.MESSAGES_TO_LOAD]
		)

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
