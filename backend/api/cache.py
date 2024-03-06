from django.core.cache import cache


USER_CACHE_TIME = 60 * 60 * 24 * 7


def get_user_cache(username):
	user_cache: dict = cache.get(username)
	if not user_cache:
		cache.set(username, {}, USER_CACHE_TIME)
		return {}
	return user_cache
