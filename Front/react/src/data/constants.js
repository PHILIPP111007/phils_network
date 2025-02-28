var SERVER_HostIp = "0.0.0.0"
var SERVER_HostPort = "80"

export var FETCH_URL = `http://${SERVER_HostIp}:${SERVER_HostPort}/api/v1/`
export var WEBSOCKET_URL = `ws://${SERVER_HostIp}:${SERVER_HostPort}/ws/`

export var ROOT_ELEMENT_THEME = document.getElementsByTagName("html")[0]