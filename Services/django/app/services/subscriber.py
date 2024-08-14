from typing import Callable

from django.db.models.query import QuerySet
from django.db.models import Q, Subquery
from django.contrib.auth.models import User

from rest_framework.request import Request
from rest_framework.utils.serializer_helpers import ReturnList

from app.enums import SubscriberStatus, DeleteOption, FilterOption
from app.serializers import UserSerializer
from app.models import Subscriber


class SubscriberService:
	@staticmethod
	def _get_subscribers_sets(
		pk: int,
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
			return {"ok": False, "error": "Not provided an option."}

		subscribe = None
		if option == DeleteOption.DELETE_FRIEND.value:
			subscribe = cls.filter(user_id=request.user.pk, subscribe_id=pk).first()
		elif option == DeleteOption.DELETE_SUBSCRIBER.value:
			subscribe = cls.filter(user_id=pk, subscribe_id=request.user.pk).first()

		if subscribe is None:
			return {"ok": False, "error": "Not found subscriber."}

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

