import "./styles/Rooms.css"
import { useContext, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import { UserContext, AuthContext } from "@data/context"
import { HttpMethod } from "@data/enums"
import { useAuth, useSetUser } from "@hooks/useAuth"
import rememberPage from "@modules/rememberPage"
import Fetch from "@API/Fetch"
import ModalRoomCreate from "@pages/Rooms/components/modals/ModalRoomCreate"
import RoomCard from "@pages/Rooms/components/RoomCard"
import MainComponents from "@pages/components/MainComponents/MainComponents"
import Modal from "@pages/components/Modal"
import ScrollToTopOrBottom from "@pages/components/MainComponents/components/ScrollToTopOrBottom"
import Button from "@pages/components/UI/Button"

export default function Rooms() {

    rememberPage("/chats/")

    const { setIsAuth } = useContext(AuthContext)
    const { user, setUser } = useContext(UserContext)
    const [rooms, setRooms] = useState([])
    const [modalRoomCreate, setModalRoomCreate] = useState(false)
    const [loading, setLoading] = useState(true)
    const params = useParams()
    const roomSocket = useRef(null)

    async function createRoom(room) {
        room.subscribers.push(user.pk)

        const data = await Fetch({ action: "api/room/", method: HttpMethod.POST, body: room })
        if (data && data.ok) {
            setRooms([data.room, ...rooms])
        }
        setModalRoomCreate(false)
    }

    const showRooms = useMemo(() => {
        return (
            rooms.map((room) =>
                <RoomCard
                    key={room.id}
                    room={room}
                    link={`/chats/${user.username}/${room.id}/`}
                />
            )
        )
    }, [rooms])

    function updateRoomLastMessage(data) {
        if (data.status) {
            const room_id = Number(data.message.room)
            const newRoom = rooms.filter((room) => room.id === room_id)[0]
            let text = data.message.text
            newRoom.last_sender = data.message.username
            if (text.length > 30) {
                text = text.substring(0, 30) + "..."
            }
            newRoom.last_message = text
            setRooms((prev) => {
                return [newRoom, ...prev.filter((room) => room.id !== room_id)]
            })
        }
    }

    useEffect(() => {
        setLoading(true)
        Fetch({ action: "api/room/", method: HttpMethod.GET })
            .then((data) => {
                if (data && data.ok) {
                    setRooms(data.rooms)
                }
                setLoading(false)
            })
    }, [])

    useEffect(() => {
        roomSocket.current = rooms.map((room) => {

            const socket = new WebSocket(
                process.env.REACT_APP_SERVER_WEBSOCKET_URL
                + `chat/${room.id}/`
                + `?token=${localStorage.getItem('token')}`
            )
            socket.onopen = () => {
                console.log(`roomSocket: The connection was setup successfully.`)
            }
            socket.onclose = () => {
                console.log(`roomSocket: Has already closed.`)
            }
            socket.onerror = (e) => {
                console.error(e)
            }
            socket.onmessage = (e) => {
                const data = JSON.parse(e.data)
                updateRoomLastMessage(data)
            }

            return {
                room_id: room.id,
                socket: socket
            }
        })

        return () => {
            roomSocket.current.map((room) => {
                room.socket.close()
            })
        }
    }, [rooms.length])

    useAuth({ username: params.username, setIsAuth: setIsAuth })

    useSetUser({ username: params.username, setUser: setUser })

    return (
        <div className="Rooms">
            <MainComponents user={user} loading={loading} />

            <ScrollToTopOrBottom bottom={false} />

            <Modal modal={modalRoomCreate} setModal={setModalRoomCreate}>
                <ModalRoomCreate createRoom={createRoom} />
            </Modal>

            <Button onClick={() => setModalRoomCreate(true)} >add room</Button>

            <div className="list">
                {showRooms}
            </div>
        </div>
    )
}