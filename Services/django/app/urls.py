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


from app.views import FileAPIView, file_download
from django.urls import include, path

urlpatterns = [
	path("auth/", include("djoser.urls")),
	path("token/", include("djoser.urls.authtoken")),
]

file_patterns = [
	path("file_upload/<int:room_id>/", FileAPIView.as_view()),
	path("file_download/<int:message_id>/<str:username>/", file_download),
]

urlpatterns += file_patterns
