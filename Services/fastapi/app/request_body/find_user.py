from pydantic import BaseModel


class FindUser(BaseModel):
	username: str | None = None
	first_name: str | None = None
	last_name: str | None = None
