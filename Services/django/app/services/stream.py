from app.models import Room


class StreamService:
	@staticmethod
	def check_permission(room_id: int, subscriber_id: int) -> bool:
		"""Check if user is the Room subscriber."""

		room = Room.objects.get(pk=room_id)
		flag = room.subscribers.filter(pk=subscriber_id).exists()

		return flag
