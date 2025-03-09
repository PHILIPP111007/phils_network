__all__ = ["MessageSerializer"]


from rest_framework import serializers

from app.models import Message


class MessageSerializer(serializers.ModelSerializer):
	class Meta:
		model = Message
		fields = "__all__"
