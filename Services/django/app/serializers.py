__all__ = ["UserSerializer", "MessageSerializer"]

from django.conf import settings
from rest_framework import serializers

from app.models import Message, User


class UserSerializer(serializers.ModelSerializer):
	class Meta:
		model = User
		fields = (
			"username",
			"first_name",
			"last_name",
			"email",
			"is_online",
			"ethereum_address",
			"infura_api_key",
		)


class MessageSerializer(serializers.ModelSerializer):
	timestamp = serializers.DateTimeField(format=settings.DATETIME_FORMAT)

	class Meta:
		model = Message
		fields = "__all__"
