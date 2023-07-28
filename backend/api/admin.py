from django.contrib import admin
from .models import Blog, Subscriber, Room, Message


class BlogAdmin(admin.ModelAdmin):
    pass

class SubscriberAdmin(admin.ModelAdmin):
    pass

class RoomAdmin(admin.ModelAdmin):
    filter_horizontal = ['subscribers']
    

class MessageAdmin(admin.ModelAdmin):
    pass

admin.site.register(Blog, BlogAdmin)
admin.site.register(Subscriber, SubscriberAdmin)
admin.site.register(Room, RoomAdmin)
admin.site.register(Message, MessageAdmin)