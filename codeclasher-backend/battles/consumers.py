import json
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

ABILITIES = {
    'freeze':      {'name': 'Freeze',      'cost': 30, 'cooldown': 60,  'duration': 10},
    'malfunction': {'name': 'Malfunction', 'cost': 40, 'cooldown': 90,  'duration': 6 },
    'timebomb':    {'name': 'Time Bomb',   'cost': 20, 'cooldown': 40,  'duration': 8 },
    'shield':      {'name': 'Shield',      'cost': 25, 'cooldown': 45,  'duration': 15},
    'hack':        {'name': 'Hack',        'cost': 35, 'cooldown': 120, 'duration': 4 },
}


class BattleConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_code  = self.scope['url_route']['kwargs']['room_code']
        self.room_group = f'battle_{self.room_code}'
        self.username   = None

        # ── Authenticate via JWT in query string ─────────────────────────────
        # Frontend connects as: ws://.../?token=<access_token>
        qs = parse_qs(self.scope.get('query_string', b'').decode())
        token_list = qs.get('token', [])
        if token_list:
            self.username = await self._get_username_from_token(token_list[0])

        # Fall back to session-auth user (works when logged in via browser session)
        if not self.username:
            session_user = self.scope.get('user')
            if session_user and session_user.is_authenticated:
                self.username = session_user.username

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

        if self.username:
            await self.set_online(self.username, True)
            await self.channel_layer.group_send(self.room_group, {
                'type': 'player_connected',
                'username': self.username,
            })

    async def disconnect(self, close_code):
        if self.username:
            await self.set_online(self.username, False)
            await self.channel_layer.group_send(self.room_group, {
                'type': 'player_disconnected',
                'username': self.username,
            })
        await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data):
        try:
            data     = json.loads(text_data)
            msg_type = data.get('type', '')

            # Use authenticated username; fall back to client-supplied for
            # anonymous connections (e.g. dev without token) — see note below
            sender = self.username or data.get('from_username', 'unknown')

            if msg_type == 'typing':
                await self.channel_layer.group_send(self.room_group, {
                    'type': 'player_typing',
                    'username': sender,
                    'is_typing': data.get('is_typing', False),
                })

            elif msg_type == 'chat':
                await self.channel_layer.group_send(self.room_group, {
                    'type': 'chat_message',
                    'username': sender,
                    'message': data.get('message', '')[:200],
                })

            elif msg_type == 'use_ability':
                ability_id = data.get('ability_id', '')
                if ability_id not in ABILITIES:
                    return
                ability = ABILITIES[ability_id]
                await self.channel_layer.group_send(self.room_group, {
                    'type': 'ability_used',
                    'ability_id':      ability_id,
                    'ability_name':    ability['name'],
                    'from_username':   sender,
                    'target_username': data.get('target_username', ''),
                    'duration':        ability['duration'],
                    'code_snapshot':   data.get('code_snapshot', '') if ability_id == 'hack' else '',
                })

            elif msg_type == 'ability_result':
                await self.channel_layer.group_send(self.room_group, {
                    'type': 'ability_result_broadcast',
                    'ability_id': data.get('ability_id', ''),
                    'username':   sender,
                    'result':     data.get('result', ''),
                })

            elif msg_type == 'hack_response':
                # Target sends their code back to the attacker
                await self.channel_layer.group_send(self.room_group, {
                    'type': 'hack_response_broadcast',
                    'target_username': data.get('target_username', ''),
                    'code': data.get('code', '')[:600],
                })

            elif msg_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))

        except json.JSONDecodeError:
            pass

    # ── Group message handlers ────────────────────────────────────────────────

    async def battle_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'battle_update',
            'event': event['event'],
            'data':  event['data'],
        }))

    async def player_connected(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_connected',
            'username': event['username'],
        }))

    async def player_disconnected(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_disconnected',
            'username': event['username'],
        }))

    async def player_typing(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_typing',
            'username': event['username'],
            'is_typing': event['is_typing'],
        }))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat',
            'username': event['username'],
            'message':  event['message'],
        }))

    async def ability_used(self, event):
        await self.send(text_data=json.dumps({
            'type':            'ability_used',
            'ability_id':      event['ability_id'],
            'ability_name':    event['ability_name'],
            'from_username':   event['from_username'],
            'target_username': event['target_username'],
            'duration':        event['duration'],
            'code_snapshot':   event.get('code_snapshot', ''),
        }))

    async def hack_response_broadcast(self, event):
        await self.send(text_data=json.dumps({
            'type':             'hack_response',
            'target_username':  event['target_username'],
            'code':             event['code'],
        }))

    async def ability_result_broadcast(self, event):
        await self.send(text_data=json.dumps({
            'type':       'ability_result',
            'ability_id': event['ability_id'],
            'username':   event['username'],
            'result':     event['result'],
        }))

    # ── Helpers ───────────────────────────────────────────────────────────────

    @database_sync_to_async
    def _get_username_from_token(self, token_str):
        """Decode a JWT access token and return the username, or None."""
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            from django.contrib.auth.models import User
            token = AccessToken(token_str)
            user  = User.objects.get(id=token['user_id'])
            return user.username
        except Exception:
            return None

    @database_sync_to_async
    def set_online(self, username, online):
        try:
            from django.contrib.auth.models import User
            user    = User.objects.get(username=username)
            profile = user.profile
            profile.is_online = online
            profile.save(update_fields=['is_online', 'last_seen'])
        except Exception:
            pass
