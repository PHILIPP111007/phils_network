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
	ChatAPIView,
	FriendsAPIView,
	MessagesAPIView,
	RoomInvitationsAddAPIView,
	RoomInvitationsAPIView,
	RoomInvitationsRemoveAPIView,
	RoomsAPIView,
	UserAPIView,
)
from django.urls import include, path

auth_patterns = [
	path("auth/", include("djoser.urls")),
	path("token/", include("djoser.urls.authtoken")),
]
user_patterns = [
	path("user/<str:username>/", UserAPIView.as_view()),
	path("friends/<int:option>/", FriendsAPIView.as_view()),
]
room_patterns = [
	path("room/", RoomsAPIView.as_view()),
	path("room/<int:pk>/", ChatAPIView.as_view()),
	path("room/<int:pk>/<int:loaded_messages>/", MessagesAPIView.as_view()),
	path("invite_chats/<str:username>/", RoomInvitationsAPIView.as_view()),
	path(
		"invite_chats/<str:username>/add_room/<int:room_id>/",
		RoomInvitationsAddAPIView.as_view(),
	),
	path(
		"invite_chats/<str:username>/remove_room/<int:room_id>/",
		RoomInvitationsRemoveAPIView.as_view(),
	),
]

urlpatterns = auth_patterns + user_patterns + room_patterns
