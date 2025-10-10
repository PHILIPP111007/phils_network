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


def _directory_path_for_user(instance, file_name):
	# file will be uploaded to MEDIA_ROOT / <room.id>/<username>/<timestamp>/<filename>
	return f"user_{instance.sender.pk}"


def _directory_path_for_message(instance, file_name):
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
	user_timezone = models.CharField(_("User timezone"), max_length=150, blank=True)

	ethereum_address = models.CharField(
		_("ethereum address"), max_length=150, blank=True
	)
	infura_api_key = models.CharField(_("infura api key"), max_length=150, blank=True)

	image = models.FileField(
		blank=True, null=True, default=None, upload_to=_directory_path_for_user
	)

	objects = UserManager()

	EMAIL_FIELD = "email"
	USERNAME_FIELD = "username"

	class Meta:
		indexes = [
			models.Index(fields=["id"]),
			models.Index(fields=["username"]),
			models.Index(fields=["id", "username"]),
		]


class Post(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE)
	timestamp = models.DateTimeField(auto_now_add=True)
	content = models.TextField(max_length=5000)
	changed = models.BooleanField(default=False)

	class Meta:
		indexes = [
			models.Index(fields=["id"]),
			models.Index(fields=["user_id", "timestamp"]),
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

	class Meta:
		indexes = [
			models.Index(fields=["id"]),
		]

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

	class Meta:
		indexes = [
			models.Index(fields=["id"]),
			models.Index(fields=["to_user_id"]),
			models.Index(fields=["room_id", "to_user_id"]),
		]

	def __str__(self):
		return f"{self.creator} [ {self.timestamp} ]"


class Message(models.Model):
	room = models.ForeignKey(Room, on_delete=models.CASCADE)
	sender = models.ForeignKey(User, related_name="sender", on_delete=models.CASCADE)
	text = models.TextField(max_length=5000, blank=True, null=True, default=None)
	timestamp = models.DateTimeField(default=timezone.now)
	file = models.FileField(
		blank=True, null=True, default=None, upload_to=_directory_path_for_message
	)
	viewed = models.ManyToManyField(User, blank=True)
	parent = models.ForeignKey(
		"self", on_delete=models.SET_NULL, null=True, blank=True, default=None
	)

	class Meta:
		indexes = [
			models.Index(fields=["id"]),
			models.Index(fields=["room_id"]),
		]

	def __str__(self):
		return f"{self.sender.username} [ {self.timestamp} ]"


class MessageLike(models.Model):
	user = models.ForeignKey(User, related_name="user_like", on_delete=models.CASCADE)
	message = models.ForeignKey(
		Message, related_name="message_like", on_delete=models.CASCADE
	)


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
	gas = models.IntegerField(blank=True, null=True)

	class Meta:
		indexes = [
			models.Index(fields=["sender_id", "recipient_id", "timestamp"]),
		]

	def __str__(self):
		return (
			f"{self.sender.username} -> {self.recipient.username} [ {self.timestamp} ]"
		)

	@property
	def user_transactions_count(self):
		return Transaction.objects.filter(sender=self.sender).count()
