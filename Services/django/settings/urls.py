__all__ = ["urlpatterns"]

from django.contrib import admin
from django.urls import include, path
from django.conf import settings

urlpatterns = [
	path("admin_page/", admin.site.urls, name="admin_page"),
	path(f"api/v{settings.API_VERSION}/", include("app.urls"), name="api"),
]
