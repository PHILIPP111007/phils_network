from django.contrib import admin
from .models import Blog, Subscriber, Room, RoomCreator, Message


@admin.register(Blog)
class BlogAdmin(admin.ModelAdmin):
    exclude = ["content"]
    list_display = ("user", "timestamp")
    list_filter = ("user", )


@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    fields = [("user", "subscribe"), ]
    list_display = ("user", "subscribe")
    list_filter = ("user", )


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    filter_horizontal = ["subscribers"]
    list_display = ("name", "timestamp")
    list_filter = ("name", )


@admin.register(RoomCreator)
class RoomCreatorAdmin(admin.ModelAdmin):
    list_display = ("creator", "room")
    list_filter = ("creator", )


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    exclude = ["text"]
    list_display = ("sender", "room", "timestamp")
    list_filter = ("sender", "room")
