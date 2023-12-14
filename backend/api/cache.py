from django.core.cache import cache


def get_user_cache(username):
	user_cache: dict = cache.get(username)
	if not user_cache:
		cache.set(username, {}, 60 * 60 * 24 * 7)
		return {}
	return user_cache
