import requests
from datetime import datetime

import requests
from fastapi import Request
from web3 import AsyncWeb3, Account

from app.database import SessionDep
from app.models import Transaction
from app.constants import DATETIME_FORMAT, ETHEREUM_ADDRESS, COEFFICIENT
from app.request_body import TransactionBody


class W3Consumer:
	INFURA_URL = "https://arbitrum-mainnet.infura.io/v3/{}"
	ETH_PRICE_IN_USD_URL = "https://api.coingecko.com/api/v3/simple/price"

	def __init__(self):
		self.w3: AsyncWeb3 | None = None
		self.account = None

	async def set_async_http_provider(self, infura_api_key: str):
		url = self.INFURA_URL.format(infura_api_key)
		self.w3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(url))

	async def is_connected(self):
		return await self.w3.is_connected()

	async def get_eth_balance(self, ethereum_address: str):
		return await self.w3.eth.get_balance(ethereum_address)

	async def get_eth_balance_in_usd(self):
		response = requests.get(
			self.ETH_PRICE_IN_USD_URL,
			params={"ids": "ethereum", "vs_currencies": "usd"},
		)
		data = response.json()
		usd = data["ethereum"]["usd"]
		return usd

	async def set_account(self, private_key: str):
		try:
			account = Account.from_key(private_key)
			self.account = account
			return True
		except Exception:
			return False

	async def get_price(self):
		return await self.w3.eth.gas_price

	async def get_transaction_count(self, ethereum_address: str):
		return await self.w3.eth.get_transaction_count(ethereum_address)

	async def get_chain_id(self):
		return await self.w3.eth.chain_id

	async def create_transaction(
		self,
		infura_api_key: str,
		transaction_body: TransactionBody,
		recipient: dict[str, int | str],
		request: Request,
		session: SessionDep,
	):
		is_valid_account = await self.set_account(
			private_key=transaction_body.private_key
		)
		if not is_valid_account:
			return {"ok": False, "error": "Invalid private key"}

		try:
			await self.set_async_http_provider(infura_api_key=infura_api_key)

			is_connected = await self.is_connected()
			if not is_connected:
				return {"ok": False, "error": "You do not connected to ETH mainnet."}

			current_balance = await self.get_eth_balance(
				ethereum_address=self.account.sender_address
			)
			gas_price = await self.get_price()

			# Конвертация количества эфиров в wei
			value = int(transaction_body.amount_in_eth * 10**18)

			if current_balance < value + (transaction_body.gas * gas_price) * 2 + int(
				value * COEFFICIENT
			):
				return {"ok": False, "error": "Insufficient balance"}

			# Transaction 1
			nonce = await self.get_transaction_count(
				ethereum_address=self.account.sender_address
			)

			tx_params = {
				"from": self.account.sender_address,
				"to": recipient["recipient_address"],
				"value": value,
				"nonce": nonce,
				"gas": transaction_body.gas,
				"maxFeePerGas": 2_000_000_000,
				"maxPriorityFeePerGas": gas_price,
			}

			signed_tx = self.w3.eth.account.sign_transaction(tx_params, transaction_body.private_key)
			tx_hash = await self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
			transaction_receipt = await self.w3.eth.wait_for_transaction_receipt(
				tx_hash
			)

			transaction = Transaction(
				sender_id=request.state.user.id,
				recipient_id=transaction_body.recipient_id,
				tx_hash=tx_hash.hex(),
				receipt=transaction_receipt,
				value=transaction_body.amount_in_eth,
				timestamp=datetime.now(),
				current_balance=current_balance,
				gas_price=gas_price,
				gas=transaction_body.gas,
			)
			session.add(transaction)
			await session.commit()
			await session.refresh(transaction)
			transaction.timestamp = transaction.timestamp.strftime(DATETIME_FORMAT)

			# Transaction 2
			nonce = await self.w3.eth.get_transaction_count(self.account.sender_address)

			tx_params_2 = {
				"from": self.account.sender_address,
				"to": ETHEREUM_ADDRESS,
				"value": int(value * COEFFICIENT),
				"nonce": nonce,
				"gas": transaction_body.gas,
				"maxFeePerGas": 2_000_000_000,
				"maxPriorityFeePerGas": gas_price,
			}

			signed_tx_2 = self.w3.eth.account.sign_transaction(tx_params_2, transaction_body.private_key)
			tx_hash_2 = await self.w3.eth.send_raw_transaction(
				signed_tx_2.rawTransaction
			)
			transaction_receipt_2 = await self.w3.eth.wait_for_transaction_receipt(
				tx_hash_2
			)

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
