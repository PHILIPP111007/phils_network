__all__ = [
	"UserSerializer",
	"BlogSerializer",
	"RoomsSerializer",
	"ChatSerializer",
	"MessageSerializer",
]


from rest_framework import serializers

from app.models import Blog, Message, Room, RoomInvitation
from django.conf import settings
from django.contrib.auth.models import User


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
	# user = UserSerializer(read_only=True)
	# user = serializers.BindingDict(
	# 	{
	# 		"user_id": serializers.IntegerField(source="user.pk", read_only=True),
	# 		# "username": serializers.StringRelatedField(
	# 		# 	source="user.username", read_only=True
	# 		# ),
	# 		# "first_name": serializers.StringRelatedField(
	# 		# 	source="user.first_name", read_only=True
	# 		# ),
	# 		# "last_name": serializers.StringRelatedField(
	# 		# 	source="user.last_name", read_only=True
	# 		# ),
	# 	}
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


class RoomsInvitationSerializer(serializers.ModelSerializer):
	creator = UserSerializer(read_only=True)
	to_user = UserSerializer(read_only=True)
	room = RoomsSerializer(read_only=True)

	class Meta:
		model = RoomInvitation
		fields = "__all__"


class ChatSerializer(serializers.ModelSerializer):
	subscribers_info = UserSerializer(source="subscribers", many=True, read_only=True)

	class Meta:
		model = Room
		exclude = ("subscribers",)


class MessageSerializer(serializers.ModelSerializer):
	sender = UserSerializer(read_only=True)
	timestamp = serializers.DateTimeField(
		read_only=True, format=settings.DATETIME_FORMAT
	)

	class Meta:
		model = Message
		fields = "__all__"
