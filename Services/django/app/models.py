from django.contrib.auth.models import (
	AbstractBaseUser,
	PermissionsMixin,
	User,
	UserManager,
)
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


def _user_directory_path(instance, file_name):
	# file will be uploaded to MEDIA_ROOT / <room.id>/<username>/<timestamp>/<filename>
	return f"{instance.sender.username}/{instance.room.id}/{instance.timestamp}/{file_name}"


class User(AbstractBaseUser, PermissionsMixin):
	username_validator = UnicodeUsernameValidator()

	username = models.CharField(
		_("username"),
		max_length=150,
		unique=True,
		help_text=_(
			"Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only."
		),
		validators=[username_validator],
		error_messages={
			"unique": _("A user with that username already exists."),
		},
	)
	first_name = models.CharField(_("first name"), max_length=150, blank=True)
	last_name = models.CharField(_("last name"), max_length=150, blank=True)
	email = models.EmailField(_("email address"), blank=True)
	date_joined = models.DateTimeField(_("date joined"), default=timezone.now)
	is_staff = models.BooleanField(
		_("staff status"),
		default=False,
		help_text=_("Designates whether the user can log into this admin site."),
	)
	is_active = models.BooleanField(
		_("active"),
		default=True,
		help_text=_(
			"Designates whether this user should be treated as active. "
			"Unselect this instead of deleting accounts."
		),
	)
	is_online = models.BooleanField(default=False)

	ethereum_address = models.CharField(
		_("ethereum address"), max_length=150, blank=True
	)
	infura_api_key = models.CharField(_("infura api key"), max_length=150, blank=True)

	objects = UserManager()

	EMAIL_FIELD = "email"
	USERNAME_FIELD = "username"

	class Meta:
		indexes = [
			models.Index(fields=["id"]),
			models.Index(fields=["id", "username"]),
		]


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
	creator = models.ForeignKey(
		User,
		related_name="room_creator",
		on_delete=models.SET_NULL,
		default=None,
		null=True,
	)
	timestamp = models.DateTimeField(auto_now_add=True)
	subscribers = models.ManyToManyField(User, blank=True)

	def __str__(self):
		return f"{self.name} [ {self.timestamp} ]"


class RoomInvitation(models.Model):
	creator = models.ForeignKey(
		User,
		on_delete=models.CASCADE,
		related_name="room_invitation_creator",
		default=None,
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


class Transaction(models.Model):
	sender = models.ForeignKey(
		User, related_name="transaction_sender", on_delete=models.SET_NULL, null=True
	)
	recipient = models.ForeignKey(
		User, related_name="transaction_recipient", on_delete=models.SET_NULL, null=True
	)
	timestamp = models.DateTimeField(auto_now_add=True)
	tx_hash = models.CharField(max_length=1_000, blank=True)
	receipt = models.CharField(max_length=1_000, blank=True)
	value = models.IntegerField(blank=True)
	current_balance = models.IntegerField(blank=True, null=True)
	gas_price = models.IntegerField(blank=True, null=True)

	def __str__(self):
		return f"{self.sender.username} [ {self.timestamp} ]"
