__all__ = ["urlpatterns"]

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
	path("admin/", admin.site.urls, name="admin"),
	path("api/v1/", include("app.urls"), name="api"),
]
