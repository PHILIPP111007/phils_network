__all__ = ["Blog"]


from sqlmodel import Field, SQLModel


class Subscriber(SQLModel, table=True):
    __tablename__ = "app_subscriber"

    id: int = Field(primary_key=True)
    subscribe_id: int = Field(foreign_key="auth_user.id")
    user_id: int = Field(foreign_key="auth_user.id")
