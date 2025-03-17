from django.contrib.auth.models import User
from django.db import models


def _user_directory_path(instance, file_name):
	# file will be uploaded to MEDIA_ROOT / user_<username>/<filename>
	return f"{instance.sender.username}/{instance.room.id}/{file_name}"


class Post(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE)
	timestamp = models.DateTimeField(auto_now_add=True)
	content = models.TextField(max_length=5000)
	changed = models.BooleanField(default=False)

	class Meta:
		indexes = [
			models.Index(fields=["user_id"]),
		]

	def __str__(self):
		return f"{self.user.username} [ {self.timestamp} ]"


class Subscriber(models.Model):
	user = models.ForeignKey(User, related_name="user", on_delete=models.CASCADE)
	subscribe = models.ForeignKey(
		User, related_name="subscribe", on_delete=models.CASCADE
	)

	class Meta:
		indexes = [
			models.Index(fields=["user_id"]),
			models.Index(fields=["subscribe_id"]),
			models.Index(fields=["user_id", "subscribe_id"]),
		]

	def __str__(self):
		return self.user.username


class Room(models.Model):
	name = models.CharField(max_length=50)
	timestamp = models.DateTimeField(auto_now_add=True)
	subscribers = models.ManyToManyField(User, blank=True)

	def __str__(self):
		return f"{self.name} [ {self.timestamp} ]"


class RoomCreator(models.Model):
	creator = models.ForeignKey(User, on_delete=models.CASCADE)
	room = models.ForeignKey(Room, on_delete=models.CASCADE)

	def __str__(self):
		return self.creator.username


class RoomInvitation(models.Model):
	creator = models.ForeignKey(
		User, on_delete=models.CASCADE, related_name="creator", default=None
	)
	to_user = models.ForeignKey(
		User, on_delete=models.CASCADE, related_name="to_user", default=None
	)
	room = models.ForeignKey(Room, on_delete=models.CASCADE)
	timestamp = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"{self.creator} [ {self.timestamp} ]"


class Message(models.Model):
	room = models.ForeignKey(Room, on_delete=models.CASCADE)
	sender = models.ForeignKey(User, related_name="sender", on_delete=models.CASCADE)
	text = models.TextField(max_length=5000, blank=True, null=True, default=None)
	timestamp = models.DateTimeField(auto_now_add=True)
	file = models.FileField(
		blank=True, null=True, default=None, upload_to=_user_directory_path
	)
	viewed = models.ManyToManyField(User, blank=True)

	class Meta:
		indexes = [
			models.Index(fields=["room_id"]),
		]

	def __str__(self):
		return f"{self.sender.username} [ {self.timestamp} ]"


class OnlineStatus(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE)
	is_online = models.BooleanField(default=False)

	class Meta:
		verbose_name_plural = "Online Statuses"
		indexes = [
			models.Index(fields=["user_id"]),
		]

	def __str__(self):
		return f"{self.user.username} [ is_online={self.is_online} ]"
