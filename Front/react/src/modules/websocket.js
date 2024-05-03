import { WEBSOCKET_URL } from "@data/constants"

export default function getWebSocket({ socket_name, path }) {
    var socket = new WebSocket(
        WEBSOCKET_URL
        + path
        + `?token=${localStorage.getItem('token')}`
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