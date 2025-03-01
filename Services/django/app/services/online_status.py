from app.models import OnlineStatus
from django.contrib.auth.models import User


class OnlineStatusService:
	@staticmethod
	def create(user: User) -> OnlineStatus:
		if not OnlineStatus.objects.filter(user=user):
			return OnlineStatus.objects.create(user=user, is_online=False)
