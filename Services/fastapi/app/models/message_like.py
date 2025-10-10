__all__ = ["MessageLike"]


from sqlmodel import Field, Relationship, SQLModel


class MessageLike(SQLModel, table=True):
	__tablename__ = "app_messagelike"

	id: int = Field(primary_key=True)
	user_id: int = Field(foreign_key="app_user.id")
	message_id: int = Field(foreign_key="app_message.id")
	user: "User" = Relationship(back_populates="likes")
	message: "Message" = Relationship(back_populates="likes")
