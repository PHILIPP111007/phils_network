import "./styles/Rooms.css"
import { useContext, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import { UserContext, AuthContext } from "@data/context"
import { HttpMethod } from "@data/enums"
import { useAuth, useSetUser } from "@hooks/useAuth"
import rememberPage from "@modules/rememberPage"
import getSocket from "@modules/websocket"
import Fetch from "@API/Fetch"
import ModalRoomCreate from "@pages/Rooms/components/modals/ModalRoomCreate"
import RoomCard from "@pages/Rooms/components/RoomCard"
import MainComponents from "@pages/components/MainComponents/MainComponents"
import Modal from "@pages/components/Modal"
import ScrollToTopOrBottom from "@pages/components/MainComponents/components/ScrollToTopOrBottom"
import Button from "@pages/components/UI/Button"

export default function Rooms() {

    rememberPage("/chats/")

    var { setIsAuth } = useContext(AuthContext)
    var { user, setUser } = useContext(UserContext)
    var [rooms, setRooms] = useState([])
    var [modalRoomCreate, setModalRoomCreate] = useState(false)
    var [loading, setLoading] = useState(true)
    var params = useParams()
    var roomSocket = useRef(null)

    async function createRoom(room) {
        room.subscribers.push(user.pk)

        var data = await Fetch({ action: "api/room/", method: HttpMethod.POST, body: room })
        if (data && data.ok) {
            setRooms([data.room, ...rooms])
        }
        setModalRoomCreate(false)
    }

    var showRooms = useMemo(() => {
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
            var room_id = Number(data.message.room)
            var newRoom = rooms.filter((room) => room.id === room_id)[0]
            var text = data.message.text
            newRoom.last_message_sender = data.message.sender.username
            if (text.length > 30) {
                text = text.substring(0, 30) + "..."
            }
            newRoom.last_message_text = text
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
            var socket = getSocket({ socket_name: "roomSocket", path: `chat/${room.id}/` })
            socket.onmessage = (e) => {
                updateRoomLastMessage(JSON.parse(e.data))
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