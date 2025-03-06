__all__ = ["RoomInvitation"]


from datetime import datetime

from sqlalchemy.orm import RelationshipProperty
from sqlmodel import Field, Relationship, SQLModel


class RoomInvitation(SQLModel, table=True):
	__tablename__ = "app_roominvitation"

	id: int = Field(primary_key=True)
	creator_id: int = Field(foreign_key="auth_user.id")
	room_id: int = Field(foreign_key="app_room.id")
	to_user_id: int = Field(foreign_key="auth_user.id")
	timestamp: datetime
	room: "Room" = Relationship(back_populates="room_invitations_rooms")
	creator: "User" = Relationship(
		sa_relationship=RelationshipProperty(
			"User",
			back_populates="room_invitations_creators",
			foreign_keys="[RoomInvitation.creator_id]",
		),
	)
	to_user: "User" = Relationship(
		sa_relationship=RelationshipProperty(
			"User",
			back_populates="room_invitations_to_users",
			foreign_keys="[RoomInvitation.to_user_id]",
		),
	)
