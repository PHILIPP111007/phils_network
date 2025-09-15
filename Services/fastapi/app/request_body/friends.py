from pydantic import BaseModel


class FriendsAndSubscribers(BaseModel):
	friends: list[int] = []
	subscribers: list[int] = []
