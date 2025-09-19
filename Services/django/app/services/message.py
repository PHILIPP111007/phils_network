from app.models import Message, Room


class MessageService:
	@staticmethod
	def create(room_id: int, sender_id: int, text: str) -> Message:
		return Message.objects.create(room_id=room_id, sender_id=sender_id, text=text)

	@staticmethod
	def delete(message_id: int):
		Message.objects.filter(pk=message_id).delete()

	@staticmethod
	def check_permission(room_id: int, subscriber_id: int) -> bool:
		"""Check if user is the Room subscriber."""

		room = Room.objects.get(pk=room_id)
		flag = room.subscribers.filter(pk=subscriber_id).exists()

		return flag
