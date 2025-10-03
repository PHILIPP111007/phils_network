__all__ = ["Room"]


from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel


class Room(SQLModel, table=True):
	__tablename__ = "app_room"

	id: int = Field(primary_key=True)
	name: str
	timestamp: datetime = Field(default_factory=lambda: datetime.now())
	creator_id: int = Field(foreign_key="app_user.id")
	creator: "User" = Relationship(back_populates="room_creators")
	room_subscribers: list["RoomSubscribers"] = Relationship(back_populates="room")
	messages: list["Message"] = Relationship(back_populates="room")
	room_invitations_rooms: list["RoomInvitation"] = Relationship(back_populates="room")
