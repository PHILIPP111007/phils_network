__all__ = ["User"]


from sqlmodel import Field, Relationship, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "auth_user"

    id: int = Field(primary_key=True)
    username: str
    email: str
    first_name: str
    last_name: str

    tokens: list["Token"] = Relationship(back_populates="user")
