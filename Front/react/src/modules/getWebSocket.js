import { WEBSOCKET_DJANGO_URL, WEBSOCKET_FASTAPI_URL } from "../data/constants.js"
import getToken from "./getToken"

export function getWebSocketDjango({ socket_name, path }) {
    var socket = new WebSocket(
        WEBSOCKET_DJANGO_URL
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
    var socket = new WebSocket(
        WEBSOCKET_FASTAPI_URL
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