from django.conf import settings
from django.core.cache import cache
from django.db.models.query import QuerySet

from rest_framework.utils.serializer_helpers import ReturnList

from app.models import Blog
from app.serializers import BlogSerializer
from app.cache import get_user_cache


class BlogService:
	@staticmethod
	def filter(pk: int) -> QuerySet[Blog]:
		return Blog.objects.filter(pk=pk)

	@staticmethod
	def filter_by_username(**kwargs: dict) -> ReturnList:
		"""Lazy loading of posts on the user page."""

		username: str = kwargs.get("username")
		loaded_posts: int = kwargs.get("loaded_posts")

		user_cache: dict = get_user_cache(username=username)
		if user_cache:
			blog_cache = user_cache.get("blog")
			if blog_cache:
				return blog_cache[loaded_posts : loaded_posts + settings.POSTS_TO_LOAD]

		posts = (
			Blog.objects.filter(user_id__username=username)
			.select_related("user")
			.only(
				"content",
				"timestamp",
				"changed",
				"user__username",
				"user__first_name",
				"user__last_name",
			)
		)
		posts = BlogSerializer(posts, many=True).data

		user_cache["blog"] = posts
		cache.set(username, user_cache)

		return posts

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
