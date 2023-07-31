from django.db import models
from django.db.models import Q
from django.contrib.auth.models import User


class Blog(models.Model):
	user = models.ForeignKey(User, to_field="username", db_column="user", on_delete=models.CASCADE)
	date_time = models.DateTimeField(auto_now_add=True)
	content = models.TextField(max_length=5000)
	is_changed = models.BooleanField(default=False)

	class Meta:
		ordering=["-date_time"]

	def __str__(self):
		return self.user.username


class Subscriber(models.Model):
	user = models.ForeignKey(User, related_name="user_1", to_field="username", db_column="user", on_delete=models.CASCADE)
	subscribe = models.ForeignKey(User, related_name="user_2", to_field="username", db_column="subscribe", on_delete=models.CASCADE)

	def __str__(self):
		return f"{self.user.username} -> {self.subscribe.username}"

	@staticmethod
	def get_friends(username):
		set_1 = Subscriber.objects.filter(user=username).values_list("subscribe", flat=True)
		set_2 = Subscriber.objects.filter(subscribe=username).values_list("user", flat=True)
		query = User.objects.filter(
			Q(username__in=set_1) & Q(username__in=set_2)
		)
		return query
	
	@staticmethod
	def get_subscriptions(username):
		set_1 = Subscriber.objects.filter(user=username).values_list("subscribe", flat=True)
		set_2 = Subscriber.objects.filter(subscribe=username).values_list("user", flat=True)
		query = User.objects.filter(
			Q(username__in=set_1) & ~Q(username__in=set_2)
		)
		return query
	
	@staticmethod
	def get_subscribers(username):
		set_1 = Subscriber.objects.filter(user=username).values_list("subscribe", flat=True)
		set_2 = Subscriber.objects.filter(subscribe=username).values_list("user", flat=True)
		query = User.objects.filter(
			Q(username__in=set_2) & ~Q(username__in=set_1)
		)
		return query


class Room(models.Model):
	name = models.CharField(max_length=50)
	subscribers = models.ManyToManyField(User, blank=True)
	
	def __str__(self):
		return f"{self.name}"
	

class RoomCreator(models.Model):
	room = models.ForeignKey(Room, on_delete=models.CASCADE)
	creator = models.ForeignKey(User, on_delete=models.CASCADE)

	def __str__(self):
		return f"{self.room}"


class Message(models.Model):
	room = models.ForeignKey(Room, on_delete=models.CASCADE)
	sender = models.ForeignKey(User, to_field="username", db_column="sender", on_delete=models.CASCADE)
	text = models.TextField(max_length=5000)
	timestamp = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering=["timestamp"]
	
	def __str__(self):
		return f"{self.room} {self.sender} [{self.timestamp}]"
