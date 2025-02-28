from rest_framework.request import Request

from app.models import Message, Room, RoomCreator, RoomInvitation
from django.contrib.auth.models import User
from django.db.models import OuterRef, Subquery
from django.db.models.query import QuerySet


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
				for user_pk in friends:
					friend = User.objects.get(pk=user_pk)
					RoomInvitation.objects.create(
						creator=request.user, to_user=friend, room=room
					)
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

		subscribers_pk_list: list[int] | None = request.data.get("subscribers", None)
		room = Room(name=room_name)
		room.save()

		if subscribers_pk_list:
			subscribers = User.objects.filter(pk__in=subscribers_pk_list)

			if subscribers:
				room.subscribers.add(request.user)

				for user in subscribers:
					if user == request.user:
						continue
					RoomInvitation.objects.create(
						room=room, creator=request.user, to_user=user
					)

		RoomCreator.objects.get_or_create(room=room, creator=request.user)

		return room


class RoomCreatorService:
	@staticmethod
	def filter(pk: int) -> QuerySet[RoomCreator]:
		return (
			RoomCreator.objects.filter(room_id=pk)
			.select_related("creator")
			.only("creator__username")
		)


class RoomInvitationsService:
	@staticmethod
	def filter(user: User):
		return (
			RoomInvitation.objects.filter(to_user=user)
			.select_related("creator", "to_user")
			.only(
				"timestamp",
				"creator__username",
				"creator__first_name",
				"creator__last_name",
				"to_user__username",
				"to_user__first_name",
				"to_user__last_name",
				"room__name",
			)
		)

	@staticmethod
	def add(username: str, room_id: int):
		room_invite = RoomInvitation.objects.filter(pk=room_id).first()
		room_creator = RoomCreator.objects.filter(room=room_invite.room).first()

		if room_creator:
			room_invite.delete()
			room = Room.objects.filter(pk=room_creator.room.pk).first()

			user = User.objects.get(username=username)
			room.subscribers.add(user)

	@staticmethod
	def remove(room_id: int):
		room = RoomInvitation.objects.filter(pk=room_id).first()
		if room:
			room.delete()
