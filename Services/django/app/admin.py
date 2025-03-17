from app.models import (
	Message,
	OnlineStatus,
	Post,
	Room,
	RoomCreator,
	RoomInvitation,
	Subscriber,
)
from django.contrib import admin


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
	exclude = ("content",)
	list_display = ("user", "timestamp")
	list_filter = ("user",)
	ordering = ("-timestamp",)
	search_fields = ("user__username",)


@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
	fields = [
		("user", "subscribe"),
	]
	list_display = ("user", "subscribe")
	list_filter = ("user",)


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
	filter_horizontal = ("subscribers",)
	list_display = ("name", "timestamp", "room_messages", "room_subscribers")
	list_filter = ("name",)
	ordering = ("-timestamp",)
	search_fields = ("name",)

	def room_messages(self, room):
		messages_count = Message.objects.filter(room=room.id).count()
		return f"{messages_count}"

	def room_subscribers(self, room):
		subscribers_count = Room.objects.filter(pk=room.id).first().subscribers.count()
		return f"{subscribers_count}"


@admin.register(RoomCreator)
class RoomCreatorAdmin(admin.ModelAdmin):
	list_display = ("creator", "room")
	list_filter = ("creator",)


@admin.register(RoomInvitation)
class RoomInvitationAdmin(admin.ModelAdmin):
	list_display = ("creator", "to_user", "room", "timestamp")
	list_filter = ("creator",)
	ordering = ("-timestamp",)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
	exclude = ("text",)
	filter_horizontal = ("viewed",)
	list_display = ("sender", "room", "timestamp")
	list_filter = ("sender", "room")
	ordering = ("-timestamp",)
	search_fields = ("sender__username",)


@admin.register(OnlineStatus)
class OnlineStatusAdmin(admin.ModelAdmin):
	list_display = ("user", "is_online")
	list_filter = ("user", "is_online")
