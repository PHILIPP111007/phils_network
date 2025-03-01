from rest_framework.request import Request

from app.models import OnlineStatus
from django.contrib.auth.models import User
from django.db.models.query import QuerySet


class UserService:
	@staticmethod
	def filter(pk: int) -> QuerySet[User]:
		users = User.objects.filter(pk=pk).only(
			"pk", "username", "first_name", "last_name"
		)
		for user in users:
			online_status = OnlineStatus.objects.filter(user_id=user.pk).first()
			if online_status:
				user.is_online = online_status.is_online
		return users

	@staticmethod
	def filter_by_username(username: str) -> QuerySet[User]:
		users = User.objects.filter(username=username).only(
			"pk", "username", "first_name", "last_name"
		)
		for user in users:
			online_status = OnlineStatus.objects.filter(user_id=user.pk).first()
			if online_status:
				user.is_online = online_status.is_online
		return users

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

			for user in query_full:
				user.is_online = (
					OnlineStatus.objects.filter(user=user).first().is_online
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
