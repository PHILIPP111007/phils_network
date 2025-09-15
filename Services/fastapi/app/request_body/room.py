from pydantic import BaseModel


class RoomNameAndSubscribers(BaseModel):
	name: str
	subscribers: list[int] = []
