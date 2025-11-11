import "./styles/Rooms.css"
import { use, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import { UserContext } from "../../data/context.js"
import { HttpMethod, CacheKeys, Language, APIVersion } from "../../data/enums.js"
import rememberPage from "../../modules/rememberPage.js"
import { getWebSocketDjango } from "../../modules/getWebSocket.js"
import Fetch from "../../API/Fetch.js"
import ModalRoomCreate from "./components/ModalRoomCreate.jsx"
import RoomCard from "./components/RoomCard.jsx"
import MainComponents from "../components/MainComponents/MainComponents.jsx"
import RoomNavBar from "./components/RoomNavBar.jsx"
import Modal from "../components/Modal.jsx"
import ScrollToTopOrBottom from "../components/MainComponents/components/ScrollToTopOrBottom.jsx"
import Button from "../components/UI/Button.jsx"

export default function Rooms() {
    var params = useParams()
    rememberPage(`chats/${params.username}`)

    var { user } = use(UserContext)
    var [rooms, setRooms] = useState([])
    var [modalRoomCreate, setModalRoomCreate] = useState(false)
    var [loading, setLoading] = useState(true)
    var roomSocket = useRef(null)
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    async function createRoom(room) {
        room.subscribers.push(user.id)

        var data = await Fetch({ api_version: APIVersion.V2, action: "room/", method: HttpMethod.POST, body: room })
        if (data && data.ok) {
            var newRooms = [data.room, ...rooms]
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
        if (data && data.status) {
            var room_id = Number(data.message.room)
            var newRoom = rooms.filter((room) => room.id === room_id)[0]
            newRoom.last_message_sender = data.message.sender.username
            newRoom.unread_messages += 1

            var text = data.message.text
            var file_name = data.message.file.path

            if (text) {
                if (text.length > 30) {
                    text = text.substring(0, 30) + "..."
                }
                newRoom.last_message_text = text
            }

            if (file_name) {
                if (file_name.length > 30) {
                    file_name = file_name.substring(0, 30) + "..."
                }
                newRoom.last_message_text = file_name
            }

            setRooms((prev) => {
                var newRooms = [newRoom, ...prev.filter((room) => room.id !== room_id)]
                return newRooms
            })
        }
    }

    async function getRooms() {
        setLoading(true)
        await Fetch({ api_version: APIVersion.V2, action: "room/", method: HttpMethod.GET })
            .then((data) => {
                if (data && data.ok) {
                    setRooms(data.rooms)
                }
            })
        setLoading(false)
    }

    useEffect(() => {
        getRooms()
    }, [])

    useEffect(() => {
        roomSocket.current = rooms.map((room) => {
            var socket = getWebSocketDjango({ socket_name: "roomSocket", path: `chat/${room.id}/${user.id}/` })
            socket.onmessage = (e) => {
                var data = JSON.parse(e.data)
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


    if (language === Language.EN) {
        return (
            <div className="Rooms">
                <MainComponents loading={loading} />

                <ScrollToTopOrBottom bottom={false} />

                <Modal modal={modalRoomCreate} setModal={setModalRoomCreate}>
                    <ModalRoomCreate createRoom={createRoom} />
                </Modal>

                <RoomNavBar />

                <Button onClick={() => setModalRoomCreate(true)} >add room</Button>

                <div className="list">
                    {showRooms}
                </div>
            </div>
        )
    } else if (language === Language.RU) {
        return (
            <div className="Rooms">
                <MainComponents loading={loading} />

                <ScrollToTopOrBottom bottom={false} />

                <Modal modal={modalRoomCreate} setModal={setModalRoomCreate}>
                    <ModalRoomCreate createRoom={createRoom} />
                </Modal>

                <RoomNavBar />

                <Button onClick={() => setModalRoomCreate(true)} >добавить комнату</Button>

                <div className="list">
                    {showRooms}
                </div>
            </div>
        )
    }
}