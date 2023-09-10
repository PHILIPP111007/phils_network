from typing import Any

from uvicorn.workers import UvicornWorker as BaseUvicornWorker

class UvicornWorker(BaseUvicornWorker):
	CONFIG_KWARGS: dict[str, Any] = {
		"loop": "auto",
		"http": "auto",
		"lifespan": "off",

		# Optional:
		# "app": "backend.asgi",
		# "reload": True,
	}
