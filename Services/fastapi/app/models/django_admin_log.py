__all__ = ["DjangoAdminLog"]


from datetime import datetime

from sqlmodel import Field, SQLModel


class DjangoAdminLog(SQLModel, table=True):
	__tablename__ = "django_admin_log"

	id: int = Field(primary_key=True)
	user_id: int = Field(foreign_key="app_user.id")
	object_id: int
	action_time: datetime
	object_repr: str
	action_flag: int
	content_type_id: int
