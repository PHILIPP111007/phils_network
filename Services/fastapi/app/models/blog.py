__all__ = ["Blog"]


from datetime import datetime

from sqlmodel import Field, Relationship, SQLModel


class Blog(SQLModel, table=True):
    __tablename__ = "app_blog"

    id: int = Field(primary_key=True)
    timestamp: datetime
    content: str
    changed: bool
    user_id: int = Field(foreign_key="auth_user.id")
    user: "User" = Relationship(back_populates="blogs")
