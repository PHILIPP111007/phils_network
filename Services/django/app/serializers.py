__all__ = [
	"UserSerializer",
	"MessageSerializer",
]


from rest_framework import serializers

from app.models import Message
from django.conf import settings
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
	is_online = serializers.BooleanField(read_only=True)

	class Meta:
		model = User
		fields = ("pk", "username", "first_name", "last_name", "email", "is_online")


class MessageSerializer(serializers.ModelSerializer):
	sender = UserSerializer(read_only=True)
	timestamp = serializers.DateTimeField(
		read_only=True, format=settings.DATETIME_FORMAT
	)

	class Meta:
		model = Message
		fields = "__all__"
