var SERVER_HOST = "0.0.0.0"
var SERVER_PORT = "80"

export var FETCH_URL = `http://${SERVER_HOST}:${SERVER_PORT}/`
export var WEBSOCKET_DJANGO_URL = `ws://${SERVER_HOST}:${SERVER_PORT}/ws/v1/`
export var WEBSOCKET_FASTAPI_URL = `ws://${SERVER_HOST}:${SERVER_PORT}/ws/v2/`

export var ROOT_ELEMENT_THEME = document.getElementsByTagName("html")[0]