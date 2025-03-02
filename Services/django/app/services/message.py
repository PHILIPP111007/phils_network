from app.models import Message, Room
from django.conf import settings
from django.db.models.query import QuerySet


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
