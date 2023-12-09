export default function getSocket({ socket_name, path }) {
    var socket = new WebSocket(
        process.env.REACT_APP_SERVER_WEBSOCKET_URL
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