from django.db.models.query import QuerySet
from django.db.models import Subquery, OuterRef
from django.contrib.auth.models import User

from rest_framework.request import Request
from app.models import RoomCreator, Room, Message


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
