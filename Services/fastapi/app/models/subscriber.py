__all__ = ["Blog"]


from sqlalchemy.orm import RelationshipProperty
from sqlmodel import Field, Relationship, SQLModel


class Subscriber(SQLModel, table=True):
    __tablename__ = "app_subscriber"

    id: int = Field(primary_key=True)
    user_id: int = Field(foreign_key="auth_user.id")
    subscribe_id: int = Field(foreign_key="auth_user.id")
    user: "User" = Relationship(
        sa_relationship=RelationshipProperty(
            "User",
            back_populates="subscriber_user",
            foreign_keys="[Subscriber.user_id]",
        ),
    )
    subscribe: "User" = Relationship(
        sa_relationship=RelationshipProperty(
            "User",
            back_populates="subscriber_subscribe",
            foreign_keys="[Subscriber.subscribe_id]",
        ),
    )
