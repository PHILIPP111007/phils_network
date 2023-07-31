from django.contrib import admin
from .models import Blog, Subscriber, Room, RoomCreator, Message


class BlogAdmin(admin.ModelAdmin):
    pass

class SubscriberAdmin(admin.ModelAdmin):
    pass

class RoomAdmin(admin.ModelAdmin):
    filter_horizontal = ['subscribers']

class RoomCreatorAdmin(admin.ModelAdmin):
    pass

class MessageAdmin(admin.ModelAdmin):
    exclude = ['text']

admin.site.register(Blog, BlogAdmin)
admin.site.register(Subscriber, SubscriberAdmin)
admin.site.register(Room, RoomAdmin)
admin.site.register(RoomCreator, RoomCreatorAdmin)
admin.site.register(Message, MessageAdmin)