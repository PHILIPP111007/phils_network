var SERVER_HostIp = process.env.REACT_APP_SERVER_HostIp || "0.0.0.0"
var SERVER_HostPort = process.env.REACT_APP_SERVER_HostPort || "8000"

export var FETCH_URL = `http://${SERVER_HostIp}:${SERVER_HostPort}/api/v1/`
export var WEBSOCKET_URL = `ws://${SERVER_HostIp}:${SERVER_HostPort}/ws/`

export var ROOT_ELEMENT_THEME = document.getElementsByTagName("html")[0]
export var MESSAGES_TO_CACHE = 25