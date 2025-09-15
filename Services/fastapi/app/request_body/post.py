from pydantic import BaseModel


class Content(BaseModel):
	content: str


class UserAndContent(BaseModel):
	user: int
	content: str
