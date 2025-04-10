from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<contact_id>\d+)/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/security/(?P<contact_id>\d+)/$', consumers.SecurityVerificationConsumer.as_asgi()),
]