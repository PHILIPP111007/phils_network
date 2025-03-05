"""
Create user:
POST http://127.0.0.1:8000/api/auth/users/ {"username": "admin", "password": "123", "email": "email@gmail.com"}

Get user info:
headers -> Authorization -> Token d91dacef1757b45259d45372359d4f7c91a856c2
GET http://127.0.0.1:8000/api/auth/users/me/

Get token and authorize (--> {"auth_token":"d91dacef1757b45259d45372359d4f7c91a856c2"}):
POST http://127.0.0.1:8000/token/token/login/ {"username": "admin", "password": "123"}

Logout:
headers -> Authorization -> Token d91dacef1757b45259d45372359d4f7c91a856c2
POST http://127.0.0.1:8000/token/token/logout/
"""

__all__ = ["urlpatterns"]

from app.views import (
	MessagesAPIView,
)
from django.urls import include, path

auth_patterns = [
	path("auth/", include("djoser.urls")),
	path("token/", include("djoser.urls.authtoken")),
]
room_patterns = [
	path("room/<int:pk>/<int:loaded_messages>/", MessagesAPIView.as_view()),
]

urlpatterns = auth_patterns + room_patterns
