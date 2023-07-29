from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Blog, Room, Message


class UserSerializer(serializers.ModelSerializer):
	class Meta:
		model = User
		fields = ('username', 'first_name', 'last_name', 'email')


class BlogSerializer(serializers.ModelSerializer):
	user_info = UserSerializer(source='user', read_only=True)
	date_time = serializers.DateTimeField(read_only=True, format="%Y-%m-%d %H:%M")
	class Meta:
		model = Blog
		fields = '__all__'


class RoomSerializer(serializers.ModelSerializer):
	subscribers_info = UserSerializer(source='subscribers', many=True, read_only=True)
	class Meta:
		model = Room
		exclude = ('subscribers', )


class MessageSerializer(serializers.ModelSerializer):
	sender_info = UserSerializer(source='sender', read_only=True)
	timestamp = serializers.DateTimeField(read_only=True, format="%Y-%m-%d %H:%M")
	class Meta:
		model = Message
		fields = '__all__'


# Ручная реализация

# class BlogSerializer(serializers.Serializer):
# 	user = serializers.CharField()
# 	date_time = serializers.DateTimeField(read_only=True)
# 	content = serializers.CharField(max_length=5000)

# 	def validate_user(self, value):
# 		try:
# 			user = User.objects.get(username=value)
# 		except User.DoesNotExist:
# 			raise serializers.ValidationError('User Does Not Exist')
# 		return user

# 	def create(self, validated_data):
# 		return Blog.objects.create(**validated_data)
	
# 	def update(self, instance, validated_data):
# 		instance.content = validated_data.get('content', instance.content)
# 		instance.save()
# 		return instance