import os
import django

# Set up Django settings early
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'calculator_app.settings')
django.setup()  # This ensures Django is fully loaded before we import other modules

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import core.routing

# Define the ASGI application
application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddlewareStack(
        URLRouter(
            core.routing.websocket_urlpatterns
        )
    ),
})
