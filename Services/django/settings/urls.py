__all__ = ["urlpatterns"]

from django.contrib import admin
from django.urls import path, include


urlpatterns = [
	path("admin/", admin.site.urls, name="admin"),
	path("auth/", include("djoser.urls.authtoken"), name="authtoken"),
	path("api/", include("app.urls"), name="api"),
]
