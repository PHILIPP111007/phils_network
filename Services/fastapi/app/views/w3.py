import requests

from fastapi import APIRouter, Request
from web3 import AsyncWeb3


router = APIRouter(tags=["w3"])


INFURA_URL = "https://arbitrum-mainnet.infura.io/v3/{}"
ETH_PRICE_IN_USD_URL = "https://api.coingecko.com/api/v3/simple/price"


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
