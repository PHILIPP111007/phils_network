from sqlmodel import select
from sqlalchemy.orm import joinedload
from fastapi import APIRouter, Request

from app.database import SessionDep
from app.models import Transaction, User
from app.constants import DATETIME_FORMAT
from app.modules.w3 import W3Consumer
from app.request_body import TransactionBody

router = APIRouter(tags=["w3"])


@router.get("/api/v2/ethereum_balance/")
async def get_ethereum_balance(request: Request):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	infura_api_key = request.state.user.infura_api_key
	if not infura_api_key:
		return {"ok": False, "error": "Not infura api key provided."}

	consumer = W3Consumer()

	await consumer.set_async_http_provider(infura_api_key=infura_api_key)

	is_connected = await consumer.is_connected()
	if not is_connected:
		return {"ok": False, "error": "You do not connected to ETH mainnet."}

	ethereum_address = request.state.user.ethereum_address
	if not ethereum_address:
		return {"ok": False, "error": "Not ETH address provided."}

	balance = await consumer.get_eth_balance(ethereum_address=ethereum_address)
	usd = await consumer.get_eth_balance_in_usd()
	balance_usd = balance * usd

	return {
		"ok": True,
		"data": {"balance": balance, "balance_usd": balance_usd, "usd": usd},
	}


@router.get("/api/v2/get_transactions/")
async def get_transactions(session: SessionDep, request: Request):
	if not request.state.user:
		return {"ok": False, "error": "Can't authenticate"}

	query = await session.exec(
		select(Transaction)
		.where(
			(Transaction.sender_id == request.state.user.id)
			| (Transaction.recipient_id == request.state.user.id)
		)
		.order_by(Transaction.timestamp.desc())
		.options(joinedload(Transaction.sender))
		.options(joinedload(Transaction.recipient))
	)

	query = query.unique().all()
	if not query:
		return {"ok": False, "error": "Not found transactions."}

	transactions = []
	for transaction in query:
		transaction = {
			"sender_id": request.state.user.id,
			"recipient_id": transaction.recipient_id,
			"tx_hash": transaction.tx_hash,
			"receipt": transaction.receipt,
			"value": transaction.value,
			"timestamp": transaction.timestamp.strftime(DATETIME_FORMAT),
			"current_balance": transaction.current_balance,
			"gas_price": transaction.gas_price,
			"sender": {
				"username": request.state.user.username,
			},
			"recipient": {
				"username": transaction.recipient.username,
			},
		}
		transactions.append(transaction)

	return {"ok": True, "transactions": transactions}


@router.post("/api/v2/send_ethereum/")
async def send_ethereum(
	session: SessionDep, request: Request, transaction_body: TransactionBody
):
	if not request.state.user:
		return {"ok": False, "error": "Can't authenticate"}

	recipient = await session.exec(
		select(User).where(User.id == transaction_body.recipient_id)
	)
	recipient = recipient.first()
	if not recipient:
		return {"ok": False, "error": "Not found user."}

	recipient = {
		"id": recipient.id,
		"username": recipient.username,
		"recipient_address": recipient.ethereum_address,
	}

	if not recipient["recipient_address"]:
		return {"ok": False, "error": "Your friend does not have Ethereum address."}

	user = request.state.user
	infura_api_key = user.infura_api_key
	if not infura_api_key:
		return {"ok": False, "error": "Infura API key missing"}

	consumer = W3Consumer()

	return await consumer.create_transaction(
		infura_api_key=infura_api_key,
		transaction_body=transaction_body,
		recipient=recipient,
		request=request,
		session=session,
	)
