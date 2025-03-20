import "./styles/Rooms.css"
import { use, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import { UserContext } from "../../data/context"
import { HttpMethod, CacheKeys, Language } from "../../data/enums"
import rememberPage from "../../modules/rememberPage"
import getWebSocket from "../../modules/getWebSocket"
import Fetch from "../../API/Fetch"
import ModalRoomCreate from "./components/ModalRoomCreate"
import RoomCard from "./components/RoomCard"
import MainComponents from "../components/MainComponents/MainComponents"
import RoomNavBar from "./components/RoomNavBar"
import Modal from "../components/Modal"
import ScrollToTopOrBottom from "../components/MainComponents/components/ScrollToTopOrBottom"
import Button from "../components/UI/Button"

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

        var data = await Fetch({ action: "api/v2/room/", method: HttpMethod.POST, body: room })
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
        data = JSON.parse(data)
        if (data && data.status) {
            var room_id = Number(data.message.room_id)
            var newRoom = rooms.filter((room) => room.id === room_id)[0]
            newRoom.last_message_sender = data.message.sender.username
            newRoom.unread_messages += 1

            var text = data.message.text
            var file_name = data.message.file

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

    useEffect(() => {
        setLoading(true)
        Fetch({ action: "api/v2/room/", method: HttpMethod.GET })
            .then((data) => {
                if (data && data.ok) {
                    setRooms(data.rooms)
                }
            })

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