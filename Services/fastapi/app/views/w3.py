import requests
from datetime import datetime

from pydantic import BaseModel
from sqlmodel import select
from sqlalchemy.orm import joinedload
from fastapi import APIRouter, Request
from web3 import AsyncWeb3, Account

from app.database import SessionDep
from app.models import Transaction, User
from app.constants import DATETIME_FORMAT


router = APIRouter(tags=["w3"])


INFURA_URL = "https://arbitrum-mainnet.infura.io/v3/{}"
ETH_PRICE_IN_USD_URL = "https://api.coingecko.com/api/v3/simple/price"


class TransactionBody(BaseModel):
	private_key: str
	recipient_id: int
	amount_in_eth: float
	gas: int


@router.get("/api/v2/ethereum_balance/")
async def get_ethereum_balance(request: Request):
	if not request.state.user:
		return {"ok": False, "error": "Can not authenticate."}

	infura_api_key = request.state.user.infura_api_key
	if not infura_api_key:
		return {"ok": False, "error": "Not infura api key provided."}

	url = INFURA_URL.format(infura_api_key)
	w3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(url))

	is_connected = await w3.is_connected()
	if not is_connected:
		return {"ok": False, "error": "You do not connected to ETH mainnet."}

	ethereum_address = request.state.user.ethereum_address
	if not ethereum_address:
		return {"ok": False, "error": "Not ETH address provided."}

	balance = await w3.eth.get_balance(ethereum_address)

	response = requests.get(
		ETH_PRICE_IN_USD_URL,
		params={"ids": "ethereum", "vs_currencies": "usd"},
	)
	data = response.json()
	usd = data["ethereum"]["usd"]

	balance_usd = balance * usd

	return {"ok": True, "balance": balance, "balance_usd": balance_usd, "usd": usd}


@router.get("/api/v2/get_transactions/")
async def get_transactions(session: SessionDep, request: Request):
	if not request.state.user:
		return {"ok": False, "error": "Can't authenticate"}

	query = await session.exec(
		select(Transaction).where(
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
	
	recipient = await session.exec(select(User).where(User.id == transaction_body.recipient_id))
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

	try:
		account = Account.from_key(transaction_body.private_key)
		sender_address = account.address
	except Exception:
		return {"ok": False, "error": "Invalid private key"}

	try:
		w3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(INFURA_URL.format(infura_api_key)))

		is_connected = await w3.is_connected()
		if not is_connected:
			return {"ok": False, "error": "You do not connected to ETH mainnet."}

		current_balance = await w3.eth.get_balance(sender_address)
		gas_price = await w3.eth.gas_price
		
		# Конвертация количества эфиров в wei
		value = int(transaction_body.amount_in_eth * 10**18)

		if current_balance < value + (transaction_body.gas * gas_price):
			return {"ok": False, "error": "Insufficient balance"}

		nonce = await w3.eth.get_transaction_count(sender_address)
		chain_id = await w3.eth.chain_id

		tx_params = {
			"nonce": nonce,
			"to": recipient["recipient_address"],
			"value": value,
			"gasPrice": gas_price,
			"gas": transaction_body.gas,
			"chainId": chain_id,
		}

		signed_tx = account.sign_transaction(tx_params)
		tx_hash = await w3.eth.send_raw_transaction(signed_tx.rawTransaction)
		transaction_receipt = await w3.eth.wait_for_transaction_receipt(tx_hash)

		transaction = Transaction(
			sender_id=request.state.user.id,
			recipient_id=transaction_body.recipient_id,
			tx_hash=tx_hash.hex(),
			receipt=transaction_receipt,
			value=transaction_body.amount_in_eth,
			timestamp=datetime.now(),
			current_balance=current_balance,
			gas_price=gas_price,
			gas=transaction_body.gas
		)
		session.add(transaction)
		await session.commit()
		await session.refresh(transaction)

		transaction.timestamp = transaction.timestamp.strftime(DATETIME_FORMAT)
		return {
			"ok": True,
			"transaction": {
				"sender_id": request.state.user.id,
				"recipient_id": transaction.recipient_id,
				"tx_hash": transaction.tx_hash,
				"receipt": transaction.receipt,
				"value": transaction.value,
				"timestamp": transaction.timestamp,
				"current_balance": transaction.current_balance,
				"gas_price": transaction.gas_price,
				"gas": transaction_body.gas,
				"sender": {
					"username": request.state.user.username,
				},
				"recipient": {
					"username": recipient["username"],
				},
			},
		}

	except Exception:
		return {"ok": False, "error": "Error creating transaction"}
