__all__ = ["User"]
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "auth_user"

    id: int = Field(primary_key=True)
    username: str = Field()
    email: str = Field()
    first_name: str = Field()
    last_name: str = Field()
