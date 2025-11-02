import { DEVELOPMENT, WEBSOCKET_DJANGO_URL, WEBSOCKET_FASTAPI_URL, DEVELOPMENT_WEBSOCKET_DJANGO_URL, DEVELOPMENT_WEBSOCKET_FASTAPI_URL } from "../data/constants.js"
import getToken from "./getToken"

export function getWebSocketDjango({ socket_name, path }) {
    var url

    if (DEVELOPMENT === "1") {
        url = DEVELOPMENT_WEBSOCKET_DJANGO_URL
    } else {
        url = WEBSOCKET_DJANGO_URL
    }

    var socket = new WebSocket(
        url
        + path
        + `?token_key=${getToken()}`
    )
    socket.onopen = () => {
        console.log(`${socket_name}: The connection was setup successfully.`)
    }
    socket.onclose = () => {
        console.log(`${socket_name}: Has already closed.`)
    }
    socket.onerror = (e) => {
        console.error(e)
    }
    return socket
}

export function getWebSocketFastAPI({ socket_name, path }) {
    var url

    if (DEVELOPMENT === "1") {
        url = DEVELOPMENT_WEBSOCKET_FASTAPI_URL
    } else {
        url = WEBSOCKET_FASTAPI_URL
    }

    var socket = new WebSocket(
        url
        + path
        + `?token_key=${getToken()}`
    )
    socket.onopen = () => {
        console.log(`${socket_name}: The connection was setup successfully.`)
    }
    socket.onclose = () => {
        console.log(`${socket_name}: Has already closed.`)
    }
    socket.onerror = (e) => {
        console.error(e)
    }
    return socket
}