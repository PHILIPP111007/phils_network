__all__ = ["Message"]

from typing import Optional

from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel


class Message(SQLModel, table=True):
	__tablename__ = "app_message"

	id: int = Field(primary_key=True)
	sender_id: int = Field(foreign_key="app_user.id")
	room_id: int = Field(foreign_key="app_room.id", index=True)
	parent_id: Optional[int] = Field(
		foreign_key="app_message.id", default=None, nullable=True
	)
	text: str
	timestamp: datetime = Field(default_factory=lambda: datetime.now())
	file: str
	sender: "User" = Relationship(back_populates="messages")
	room: "Room" = Relationship(back_populates="messages")
	viewed: list["MessageViewed"] = Relationship(back_populates="message")
	replies: list["Message"] = Relationship(
		back_populates="parent", sa_relationship_kwargs={"remote_side": "Message.id"}
	)
	parent: Optional["Message"] = Relationship(back_populates="replies")
