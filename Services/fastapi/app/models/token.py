__all__ = ["Token"]


from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel


class Token(SQLModel, table=True):
	__tablename__ = "authtoken_token"

	key: str = Field(primary_key=True)
	user_id: int = Field(foreign_key="app_user.id")
	created: datetime
	user: "User" = Relationship(back_populates="tokens")
