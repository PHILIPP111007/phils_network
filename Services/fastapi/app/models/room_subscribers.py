__all__ = ["RoomSubscribers"]


from sqlmodel import Field, Relationship, SQLModel


class RoomSubscribers(SQLModel, table=True):
    __tablename__ = "app_room_subscribers"

    id: int = Field(primary_key=True)
    user_id: int = Field(foreign_key="auth_user.id")
    room_id: int = Field(foreign_key="app_room.id")
    user: "User" = Relationship(back_populates="room_subscribers")
    room: "Room" = Relationship(back_populates="room_subscribers")
