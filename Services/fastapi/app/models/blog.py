__all__ = ["Blog"]


from datetime import datetime

from sqlmodel import Field, SQLModel


class Blog(SQLModel, table=True):
    __tablename__ = "app_blog"

    id: int = Field(primary_key=True)
    timestamp: datetime = Field()
    content: str = Field()
    changed: str = Field()
    user_id: str = Field()
