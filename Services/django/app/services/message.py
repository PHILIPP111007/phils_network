from app.serializers import MessageSerializer, UserSerializer
from app.models import Message, Room, User


class MessageService:
	@staticmethod
	def create(room_id: int, sender_id: int, text: str) -> Message:
		obj = Message.objects.create(room_id=room_id, sender_id=sender_id, text=text)
		message = MessageSerializer(obj).data
		sender = User.objects.get(pk=message["sender"])
		message["sender"] = UserSerializer(sender).data
		return message

	@staticmethod
	def delete(message_id: int):
		Message.objects.filter(pk=message_id).delete()

	@staticmethod
	def check_permission(room_id: int, subscriber_id: int) -> bool:
		"""Check if user is the Room subscriber."""

		room = Room.objects.get(pk=room_id)
		flag = room.subscribers.filter(pk=subscriber_id).exists()

		return flag
