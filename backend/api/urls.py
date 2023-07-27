from django.urls import path, re_path, include
from .views import UserAPIView, BlogAPIView, FindUserAPIView, SubscriberAPIView, NewsAPIView, FriendsAPIView

"""
Create user:
POST http://127.0.0.1:8000/api/auth/users/ {"username": "admin", "password": "123", "email": "email@gmail.com"}

Get user info:
headers -> Authorization -> Token d91dacef1757b45259d45372359d4f7c91a856c2
GET http://127.0.0.1:8000/api/auth/users/me/

Get token and authorize (--> {"auth_token":"d91dacef1757b45259d45372359d4f7c91a856c2"}):
POST http://127.0.0.1:8000/auth/token/login/ {"username": "admin", "password": "123"}

Logout:
headers -> Authorization -> Token d91dacef1757b45259d45372359d4f7c91a856c2
POST http://127.0.0.1:8000/auth/token/logout/
"""

urlpatterns = [
    path('api/auth/', include('djoser.urls')),
    re_path(r'^auth/', include('djoser.urls.authtoken')),

    path('api/user/<str:username>/', UserAPIView.as_view()),

    path('api/blog/', BlogAPIView.as_view()),
    path('api/blog/<int:pk>/', BlogAPIView.as_view()),
    path('api/blog/<str:username>/<int:loaded_posts>/', BlogAPIView.as_view()),

    path('api/news/<int:loaded_posts>/', NewsAPIView.as_view()),

    path('api/find/', FindUserAPIView.as_view()),

    path('api/subscriber/<str:username>/', SubscriberAPIView.as_view()),

    path('api/friends/<str:option>/', FriendsAPIView.as_view()),
]
