from django.db import models
from django.db.models import Q
from django.contrib.auth.models import User
from django.db.models.query import QuerySet


class Blog(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE)
	timestamp = models.DateTimeField(auto_now_add=True)
	content = models.TextField(max_length=5000)
	changed = models.BooleanField(default=False)

	class Meta:
		ordering=["-timestamp"]

	def __str__(self):
		return f"{self.user.username} [ {self.timestamp} ]"


class Subscriber(models.Model):
	user = models.ForeignKey(User, related_name="user", on_delete=models.CASCADE)
	subscribe = models.ForeignKey(User, related_name="subscribe", on_delete=models.CASCADE)

	def __str__(self):
		return f"{self.user.username}"

	@staticmethod
	def get_friends(pk: int) -> QuerySet[User]:
		set_1 = Subscriber.objects.filter(user_id=pk).only("subscribe").values_list("subscribe", flat=True)
		set_2 = Subscriber.objects.filter(subscribe_id=pk).only("user").values_list("user", flat=True)
		query = User.objects.filter(
			Q(pk__in=set_1) & Q(pk__in=set_2)
		).only("username", "first_name", "last_name")

		return query
	
	@staticmethod
	def get_subscriptions(pk: int) -> QuerySet[User]:
		set_1 = Subscriber.objects.filter(user_id=pk).only("subscribe").values_list("subscribe", flat=True)
		set_2 = Subscriber.objects.filter(subscribe_id=pk).only("user").values_list("user", flat=True)
		query = User.objects.filter(
			Q(pk__in=set_1) & ~Q(pk__in=set_2)
		).only("username", "first_name", "last_name")

		return query
	
	@staticmethod
	def get_subscribers(pk: int) -> QuerySet[User]:
		set_1 = Subscriber.objects.filter(user_id=pk).only("subscribe").values_list("subscribe", flat=True)
		set_2 = Subscriber.objects.filter(subscribe_id=pk).only("user").values_list("user", flat=True)
		query = User.objects.filter(
			Q(pk__in=set_2) & ~Q(pk__in=set_1)
		).only("username", "first_name", "last_name")

		return query


class Room(models.Model):
	name = models.CharField(max_length=50)
	timestamp = models.DateTimeField(auto_now_add=True)
	subscribers = models.ManyToManyField(User, blank=True)

	class Meta:
		ordering=["-timestamp"]
	
	def __str__(self):
		return f"{self.name} [ {self.timestamp} ]"
	

class RoomCreator(models.Model):
	creator = models.ForeignKey(User, on_delete=models.CASCADE)
	room = models.ForeignKey(Room, on_delete=models.CASCADE)

	def __str__(self):
		return f"{self.creator}"


class Message(models.Model):
	room = models.ForeignKey(Room, on_delete=models.CASCADE)
	sender = models.ForeignKey(User, on_delete=models.CASCADE)
	text = models.TextField(max_length=5000)
	timestamp = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering=["-timestamp"]
	
	def __str__(self):
		return f"{self.sender} [ {self.timestamp} ]"
