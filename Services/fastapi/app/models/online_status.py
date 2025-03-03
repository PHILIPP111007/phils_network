__all__ = ["OnlineStatus"]


from sqlmodel import Field, Relationship, SQLModel


class OnlineStatus(SQLModel, table=True):
    __tablename__ = "app_onlinestatus"

    id: int = Field(primary_key=True)
    is_online: bool
    user_id: int = Field(foreign_key="auth_user.id")
    user: "User" = Relationship(back_populates="online_statuses")
