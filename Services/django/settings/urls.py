__all__ = ["urlpatterns"]

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
	path("admin_page/", admin.site.urls, name="admin_page"),
	path("api/v1/", include("app.urls"), name="api"),
]
