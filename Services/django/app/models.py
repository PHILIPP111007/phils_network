from django.contrib.auth.models import User
from django.db import models


class Post(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE)
	timestamp = models.DateTimeField(auto_now_add=True)
	content = models.TextField(max_length=5000)
	changed = models.BooleanField(default=False)

	class Meta:
		ordering = ["-timestamp"]

	def __str__(self):
		return f"{self.user.username} [ {self.timestamp} ]"


class Subscriber(models.Model):
	user = models.ForeignKey(User, related_name="user", on_delete=models.CASCADE)
	subscribe = models.ForeignKey(
		User, related_name="subscribe", on_delete=models.CASCADE
	)

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
	sender = models.ForeignKey(User, on_delete=models.CASCADE)
	text = models.TextField(max_length=5000)
	timestamp = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-timestamp"]

	def __str__(self):
		return f"{self.sender.username} [ {self.timestamp} ]"


class OnlineStatus(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE)
	is_online = models.BooleanField(default=False)

	def __str__(self):
		return f"{self.user.username} [ is_online={self.is_online} ]"

	class Meta:
		verbose_name_plural = "Online Statuses"
