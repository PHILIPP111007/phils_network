__all__ = ["application"]

from os import environ

from django.core.asgi import get_asgi_application

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.

environ.setdefault("DJANGO_SETTINGS_MODULE", "settings.settings")
django_asgi_app = get_asgi_application()


from channels.routing import ProtocolTypeRouter

application = ProtocolTypeRouter({"http": django_asgi_app})
