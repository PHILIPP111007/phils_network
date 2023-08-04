from os import environ

from django.core.asgi import get_asgi_application

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

from api.routing import websocket_urlpatterns


# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.

environ.setdefault("DJANGO_SETTINGS_MODULE", f"{environ.get('APP_NAME')}.settings")
django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(URLRouter(websocket_urlpatterns))
        ),
    }
)
