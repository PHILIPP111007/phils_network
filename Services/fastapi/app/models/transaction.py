__all__ = ["Transaction"]

from datetime import datetime

from sqlalchemy.orm import RelationshipProperty
from sqlmodel import Field, Relationship, SQLModel


class Transaction(SQLModel, table=True):
	__tablename__ = "app_transaction"

	id: int = Field(primary_key=True)
	sender_id: int = Field(foreign_key="app_user.id")
	recipient_id: int = Field(foreign_key="app_user.id")
	timestamp: datetime
	tx_hash: str
	receipt: str
	value: int
	current_balance: int
	gas_price: int
	gas: int
	sender: "User" = Relationship(
		sa_relationship=RelationshipProperty(
			"User",
			back_populates="transactions_transaction_senders",
			foreign_keys="[Transaction.sender_id]",
		),
	)
	recipient: "User" = Relationship(
		sa_relationship=RelationshipProperty(
			"User",
			back_populates="transactions_transaction_recipients",
			foreign_keys="[Transaction.recipient_id]",
		),
	)
