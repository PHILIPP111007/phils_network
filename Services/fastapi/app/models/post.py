__all__ = ["Post"]


from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel


class Post(SQLModel, table=True):
	__tablename__ = "app_post"

	id: int = Field(primary_key=True)
	timestamp: datetime
	content: str
	changed: bool
	user_id: int = Field(foreign_key="app_user.id", index=True)
	user: "User" = Relationship(back_populates="blogs")
