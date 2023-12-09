from django.conf import settings
from django.contrib.auth.models import User

from rest_framework import serializers

from .models import Blog, Room, Message


class UserSerializer(serializers.ModelSerializer):
	class Meta:
		model = User
		fields = ("pk", "username", "first_name", "last_name", "email")


class BlogSerializer(serializers.ModelSerializer):
	username = serializers.StringRelatedField(source="user.username", read_only=True)
	first_name = serializers.StringRelatedField(
		source="user.first_name", read_only=True
	)
	last_name = serializers.StringRelatedField(source="user.last_name", read_only=True)
	timestamp = serializers.DateTimeField(
		read_only=True, format=settings.DATETIME_FORMAT
	)
	# user = serializers.PrimaryKeyRelatedField(read_only=True)
	# user_info = UserSerializer(source="user", read_only=True)

	# user_info = serializers.BindingDict()
	# 	"username": serializers.StringRelatedField(source="user.username", read_only=True),
	# 	"first_name": serializers.StringRelatedField(source="user.first_name", read_only=True),
	# 	"last_name": serializers.StringRelatedField(source="user.last_name", read_only=True),
	# )

	class Meta:
		model = Blog
		fields = "__all__"


class RoomsSerializer(serializers.ModelSerializer):
	last_message_sender = serializers.CharField(read_only=True)
	last_message_text = serializers.CharField(read_only=True)
	subscribers_info = UserSerializer(source="subscribers", many=True, read_only=True)

	class Meta:
		model = Room
		exclude = ("subscribers",)


class ChatSerializer(serializers.ModelSerializer):
	subscribers_info = UserSerializer(source="subscribers", many=True, read_only=True)

	class Meta:
		model = Room
		exclude = ("subscribers",)


class MessageSerializer(serializers.ModelSerializer):
	sender = serializers.PrimaryKeyRelatedField(read_only=True)
	username = serializers.StringRelatedField(source="sender.username", read_only=True)
	first_name = serializers.StringRelatedField(
		source="sender.first_name", read_only=True
	)
	last_name = serializers.StringRelatedField(
		source="sender.last_name", read_only=True
	)
	timestamp = serializers.DateTimeField(
		read_only=True, format=settings.DATETIME_FORMAT
	)
	# sender_info = UserSerializer(source="sender", read_only=True)

	class Meta:
		model = Message
		fields = "__all__"
