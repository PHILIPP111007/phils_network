__all__ = ["Message"]


from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel


class Message(SQLModel, table=True):
    __tablename__ = "app_message"

    id: int = Field(primary_key=True)
    sender_id: int = Field(foreign_key="auth_user.id")
    room_id: int = Field(foreign_key="app_room.id")
    text: str
    timestamp: datetime
    sender: "User" = Relationship(back_populates="messages")
    room: "Room" = Relationship(back_populates="messages")
