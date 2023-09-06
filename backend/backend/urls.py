from django.conf import settings

from django.contrib import admin
from django.urls import path, include


urlpatterns = [
	path("admin/", admin.site.urls, name="admin"),
	path("auth/", include("djoser.urls.authtoken"), name="authtoken"),
	path("api/", include("api.urls"), name="api"),
]

if settings.DEBUG:
	urlpatterns.append(
		path("__debug__/", include("debug_toolbar.urls"), name="debug_toolbar")
	)
