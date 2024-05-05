import "./styles/Rooms.css"
import { useContext, useEffect, useMemo, useRef, useState } from "react"
import { UserContext } from "@data/context"
import { HttpMethod, LocalStorageKeys } from "@data/enums"
import rememberPage from "@modules/rememberPage"
import getWebSocket from "@modules/websocket"
import Fetch from "@API/Fetch"
import ModalRoomCreate from "@pages/Rooms/components/modals/ModalRoomCreate"
import RoomCard from "@pages/Rooms/components/RoomCard"
import MainComponents from "@pages/components/MainComponents/MainComponents"
import Modal from "@pages/components/Modal"
import ScrollToTopOrBottom from "@pages/components/MainComponents/components/ScrollToTopOrBottom"
import Button from "@pages/components/UI/Button"

export default function Rooms() {

    rememberPage("chats")

    var { user } = useContext(UserContext)
    var [rooms, setRooms] = useState([])
    var [modalRoomCreate, setModalRoomCreate] = useState(false)
    var [loading, setLoading] = useState(true)
    var roomSocket = useRef(null)

    class RoomsLocalStorage {
        static get_key() {
            return `${LocalStorageKeys.ROOMS}_${user.username}`
        }
        static get() {
            return localStorage.getItem(this.get_key())
        }
        static save(rooms) {
            try {
                localStorage.setItem(this.get_key(), JSON.stringify(rooms))
            } catch (e) {
                this.delete()
                console.error(e)
            }
        }
        static delete() {
            localStorage.removeItem(this.get_key())
        }
    }

    async function createRoom(room) {
        room.subscribers.push(user.pk)

        var data = await Fetch({ action: "api/room/", method: HttpMethod.POST, body: room })
        if (data && data.ok) {
            var newRooms = [data.room, ...rooms]
            RoomsLocalStorage.save(newRooms)
            setRooms(newRooms)
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
        data = JSON.parse(data)
        if (data && data.status) {
            var room_id = Number(data.message.room)
            var newRoom = rooms.filter((room) => room.id === room_id)[0]
            var text = data.message.text
            newRoom.last_message_sender = data.message.sender.username
            if (text.length > 30) {
                text = text.substring(0, 30) + "..."
            }
            newRoom.last_message_text = text

            setRooms((prev) => {
                var newRooms = [newRoom, ...prev.filter((room) => room.id !== room_id)]
                RoomsLocalStorage.save(newRooms)
                return newRooms
            })
        }
    }

    useEffect(() => {
        setLoading(true)
        var rooms = RoomsLocalStorage.get()
        if (rooms !== null) {
            rooms = JSON.parse(rooms)
            setRooms(rooms)
        } else {
            Fetch({ action: "api/room/", method: HttpMethod.GET })
                .then((data) => {
                    if (data && data.ok) {
                        setRooms(data.rooms)
                        RoomsLocalStorage.save(data.rooms)
                    }
                })
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        roomSocket.current = rooms.map((room) => {
            var socket = getWebSocket({ socket_name: "roomSocket", path: `chat/${room.id}/` })
            socket.onmessage = (e) => {
                updateRoomLastMessage(e.data)
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

    return (
        <div className="Rooms">
            <MainComponents loading={loading} />

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