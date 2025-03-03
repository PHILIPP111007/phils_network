__all__ = ["User"]


from sqlmodel import Field, Relationship, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "auth_user"

    id: int = Field(primary_key=True)
    username: str
    email: str
    first_name: str
    last_name: str

    # Relations
    tokens: list["Token"] = Relationship(back_populates="user")
    online_statuses: list["OnlineStatus"] = Relationship(back_populates="user")
    blogs: list["Blog"] = Relationship(back_populates="user")
    subscriber_user: list["Subscriber"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={
            "primaryjoin": "Subscriber.user_id==User.id",
            "lazy": "joined",
        },
    )
    subscriber_subscriber: list["Subscriber"] = Relationship(
        back_populates="subscriber",
        sa_relationship_kwargs={
            "primaryjoin": "Subscriber.subscribe_id==User.id",
            "lazy": "joined",
        },
    )
