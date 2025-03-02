__all__ = ["OnlineStatus"]


from sqlmodel import Field, SQLModel


class OnlineStatus(SQLModel, table=True):
    __tablename__ = "app_onlinestatus"

    id: int = Field(primary_key=True)
    is_online: bool = Field()
    user_id: int = Field()
