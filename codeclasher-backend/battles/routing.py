from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/battle/(?P<room_code>[A-Z0-9]+)/$', consumers.BattleConsumer.as_asgi()),
]
