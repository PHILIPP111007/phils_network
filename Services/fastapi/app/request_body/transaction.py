from pydantic import BaseModel


class TransactionBody(BaseModel):
	private_key: str
	recipient_id: int
	amount_in_eth: float
	gas: int
