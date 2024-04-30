var SERVER_HOST = process.env.REACT_APP_SERVER_HOST || "0.0.0.0"
var SERVER_PORT = process.env.REACT_APP_SERVER_PORT || "8000"

export var FETCH_URL = `http://${SERVER_HOST}:${SERVER_PORT}/`
export var WEBSOCKET_URL = `ws://${SERVER_HOST}:${SERVER_PORT}/ws/`