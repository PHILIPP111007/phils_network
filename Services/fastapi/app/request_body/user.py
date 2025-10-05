from typing import Optional

from pydantic import BaseModel


class UserBody(BaseModel):
	first_name: Optional[str]
	last_name: Optional[str]
	email: Optional[str]
	ethereum_address: Optional[str]
	infura_api_key: Optional[str]
