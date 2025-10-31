__all__ = ["OnlineStatusConsumer"]


from app.models import User
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework.authtoken.models import Token


class OnlineStatusConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		token_key = self.scope["query_string"].decode().split("=")[-1]
		pk = await _get_user_pk(token_key=token_key)

		if not pk:
			await self.close()
		else:
			user_id = int(self.scope["url_route"]["kwargs"]["user_id"])
			flag = await _check_permission(user_id=user_id, pk=pk)
			if flag:
				online_status_group = str(user_id)
				self.room_group_name = online_status_group
				await self.channel_layer.group_add(
					self.room_group_name, self.channel_name
				)
				await _set_online_status_true(user_id=user_id)
				await self.accept()
			else:
				await self.close()

	async def disconnect(self, code):
		user_id = int(self.room_group_name)
		await _set_online_status_false(user_id=user_id)
		await self.channel_layer.group_discard(self.room_group_name, self.channel_name)


@database_sync_to_async
def _get_user_pk(token_key: str) -> int | None:
	token = Token.objects.filter(key=token_key).first()

	if token:
		return token.user_id
	return


async def _check_permission(user_id: int, pk: int) -> bool:
	return user_id == pk


@database_sync_to_async
def _set_online_status_true(user_id: int):
	user = User.objects.filter(pk=user_id).first()
	if user:
		user.is_online = True
		user.save()


@database_sync_to_async
def _set_online_status_false(user_id: int):
	user = User.objects.filter(pk=user_id).first()
	if user:
		user.is_online = False
		user.save()
