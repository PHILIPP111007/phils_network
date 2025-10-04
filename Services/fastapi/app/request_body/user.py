from typing import Optional

from fastapi import UploadFile, File
from pydantic import BaseModel


class UserBody(BaseModel):
	id: int
	first_name: str
	last_name: str
	email: str
	ethereum_address: str
	infura_api_key: str
	image: Optional[UploadFile] = File(None)
