import requests
from datetime import datetime

from pydantic import BaseModel
from sqlmodel import select
from fastapi import APIRouter, Request
from web3 import AsyncWeb3, Account

from app.database import SessionDep
from app.models import Transaction
from app.constants import DATETIME_FORMAT


router = APIRouter(tags=["w3"])


INFURA_URL = "https://arbitrum-mainnet.infura.io/v3/{}"
ETH_PRICE_IN_USD_URL = "https://api.coingecko.com/api/v3/simple/price"


class TransactionBody(BaseModel):
	private_key: str
	recipient_id: int
	amount_in_eth: float


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

	transactions = await session.exec(
		select(Transaction).where(
			(Transaction.sender_id == request.state.user.id)
			| (Transaction.recipient_id == request.state.user.id)
		)
	)

	query = transactions.unique().all()
	if not query:
		return {"ok": False, "error": "Not found transactions."}

	transactions = []
	for transaction in query:
		transaction = {
			"id": transaction.id,
			"sender_id": transaction.sender_id,
			"recipient_id": transaction.recipient_id,
			"timestamp": transaction.timestamp.strftime(DATETIME_FORMAT),
			"tx_hash": transaction.tx_hash,
			"receipt": transaction.receipt,
			"value": transaction.value,
		}
		transactions.append(transaction)

	return {"ok": True, "transactions": transactions}


@router.post("/api/v2/send_ethereum/")
async def send_ethereum(
	session: SessionDep, request: Request, transaction_body: TransactionBody
):
	if not request.state.user:
		return {"ok": False, "error": "Can't authenticate"}

	# user = request.state.user
	# infura_api_key = user.infura_api_key
	# if not infura_api_key:
	# 	return {"ok": False, "error": "Infura API key missing"}

	# try:
	# 	account = Account.from_key(transaction_body.private_key)
	# 	sender_address = account.address
	# except Exception as e:
	# 	return {"ok": False, "error": "Invalid private key"}

	# try:
	# 	w3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(INFURA_URL.format(infura_api_key)))

	# 	is_connected = await w3.is_connected()
	# 	if not is_connected:
	# 		return {"ok": False, "error": "You do not connected to ETH mainnet."}

	# 	current_balance = await w3.eth.get_balance(sender_address)
	# 	gas_price = await w3.eth.gas_price
	# 	nonce = await w3.eth.get_transaction_count(sender_address)
	# 	value = int(transaction_body.amount_in_eth * 10**18)

	# 	tx_params = {
	# 		"nonce": nonce,
	# 		"to": transaction_body.recipient_address,
	# 		"value": value,
	# 		"gasPrice": gas_price,
	# 		"gas": 21000,
	# 		"chainId": w3.eth.chain_id,
	# 	}

	# 	signed_tx = account.sign_transaction(tx_params)
	# 	tx_hash = await w3.eth.send_raw_transaction(signed_tx.rawTransaction)
	# 	transaction_receipt = await w3.eth.wait_for_transaction_receipt(tx_hash)

	# 	return {
	# 		"ok": True,
	# 		"tx_hash": tx_hash.hex(),
	# 		"receipt": transaction_receipt,
	# 		"recipient_address": transaction_body.recipient_address,
	# 		"value": value,
	# 	}
	# return {
	# 		"ok": True,
	# 		"transaction": {
	# 			"sender_id": request.state.user.id,
	# 			"recipient_id": transaction.recipient_id,
	# 			"tx_hash": transaction.tx_hash,
	# 			"receipt": transaction.receipt,
	# 			"value": transaction.value,
	# 			"timestamp": transaction.timestamp,
	# 		}
	# 	}

	# except Exception as e:
	# 	return {"ok": False, "error": str(e)}

	transaction = Transaction(
		sender_id=request.state.user.id,
		recipient_id=transaction_body.recipient_id,
		tx_hash="WIPDWIkdoejd21378138r2f932",
		receipt="ODID*#A(&uf49fi43j948t54t540",
		value=transaction_body.amount_in_eth,
		timestamp=datetime.now(),
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
		},
	}
