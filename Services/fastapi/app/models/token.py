__all__ = ["Token"]


from datetime import datetime

from sqlmodel import Field, SQLModel


class Token(SQLModel, table=True):
    __tablename__ = "authtoken_token"

    key: str = Field(primary_key=True)
    user_id: int = Field()
    created: datetime = Field()
