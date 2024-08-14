from django.db.models.query import QuerySet

from app.models import RoomCreator


class RoomCreatorService:
	@staticmethod
	def filter(pk: int) -> QuerySet[RoomCreator]:
		return (
			RoomCreator.objects.filter(room_id=pk)
			.select_related("creator")
			.only("creator__username")
		)
