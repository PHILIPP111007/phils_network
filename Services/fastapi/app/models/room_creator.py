__all__ = ["RoomCreator"]


from sqlmodel import Field, Relationship, SQLModel


class RoomCreator(SQLModel, table=True):
	__tablename__ = "app_roomcreator"

	id: int = Field(primary_key=True)
	creator_id: int = Field(foreign_key="app_user.id")
	room_id: int = Field(foreign_key="app_room.id")
	creator: "User" = Relationship(back_populates="room_creators")
	room: "Room" = Relationship(back_populates="room_creators")
