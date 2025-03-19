__all__ = ["MessageViewed"]


from sqlmodel import Field, Relationship, SQLModel


class MessageViewed(SQLModel, table=True):
	__tablename__ = "app_message_viewed"

	id: int = Field(primary_key=True)
	message_id: int = Field(foreign_key="app_message.id")
	user_id: int = Field(foreign_key="app_user.id")
	user: "User" = Relationship(back_populates="viewed")
	message: "Message" = Relationship(back_populates="viewed")
