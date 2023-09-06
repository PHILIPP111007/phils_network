####################
#
# Creates test DB
#
# Run inside django:
# python manage.py shell < test_db.py
#
####################
import random

from django.contrib.auth.models import User

from api.models import (
	Blog,
	Room,
	RoomCreator
)

def _create_users(user_count: int, username: str) -> None:
	first_name: str = 'Test'
	last_name: str = 'Test'
	email: str = '@example.com'
	password: str = 'dojoefj12312321321ofewofjewofj'

	old_test_users = User.objects.filter(username__contains=username)
	old_test_users.delete()

	new_test_users: list = []
	for i in range(1, user_count + 1):

		username_id = f'{username}_{i}'
		email_id = f'{username_id}{email}'

		new_test_users.append(
			User(
				username=username_id,
				password=password,
				email=email_id,
				first_name=first_name,
				last_name=last_name
			)
		)

	User.objects.bulk_create(new_test_users)
	print('create_users: Done.')


def _create_blogs(username: str, blog_count: int) -> None:
	users: list[int] = User.objects \
		.filter(username__contains=username) \
		.values_list('pk', flat=True)

	for i in users:
		blog: list = []
		for _ in range(blog_count):
			content = ''.join([chr(random.randint(ord('a'), ord('z'))) for _ in range(random.randint(1, 5000))])

			blog.append(
				Blog(
					user_id=i,
					content=content
				)
			)

		Blog.objects.bulk_create(blog)
	print('create_blogs: Done.')


def _create_rooms(username: str, room_count: int) -> None:
	old_rooms = Room.objects.filter(name__contains=username)
	old_rooms.delete()

	users: list[int] = User.objects \
		.filter(username__contains=username) \
		.values_list('pk', flat=True)

	for _ in range(room_count):
		i = random.choice(users)

		subscribers = set(random.choice(users) for _ in range(1, len(users)))
		subscribers.add(i)
		subscribers = list(subscribers)

		room_name: str = username + '_' + ''.join([chr(random.randint(ord('a'), ord('z'))) for _ in range(random.randint(3, 30))])
		room = Room(name=room_name)
		room.save()
		room.subscribers.add(*subscribers)
		RoomCreator.objects.get_or_create(room_id=room.id, creator_id=i)
	print('create_rooms: Done.')


# Main function
def create_test_db() -> None:
	user_count: int = 100
	blog_count: int = 40
	room_count: int = 10
	username: str = 'test'

	_create_users(user_count=user_count, username=username)
	_create_blogs(username=username, blog_count=blog_count)
	_create_rooms(username=username, room_count=room_count)
	print('create_test_db: Done.')


# Run from shell
if __name__ == 'django.core.management.commands.shell':
	create_test_db()
