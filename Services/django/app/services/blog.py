from app.models import Blog
from django.conf import settings
from django.db.models.query import QuerySet


class BlogService:
	@staticmethod
	def filter(pk: int) -> QuerySet[Blog]:
		return Blog.objects.filter(pk=pk)

	@staticmethod
	def filter_by_friends(friends: list, loaded_posts: int) -> QuerySet[Blog]:
		"""Lazy loading of posts on the news page."""

		posts = (
			Blog.objects.filter(user_id__in=friends)
			.select_related("user")
			.only(
				"content",
				"timestamp",
				"changed",
				"user__username",
				"user__first_name",
				"user__last_name",
			)[loaded_posts : loaded_posts + settings.POSTS_TO_LOAD]
		)

		return posts
