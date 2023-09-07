import "./styles/Rooms.css"
import { useContext, useEffect, useState } from "react"
import { UserContext } from "../../data/context"
import Fetch from "../../API/Fetch"
import ModalRoomCreate from "./components/modals/ModalRoomCreate"
import RoomCard from "./components/RoomCard"
import MainComponents from "../components/MainComponents/MainComponents"
import Modal from "../components/Modal"
import Button from "../components/UI/Button"

export default function Rooms() {

    const { user } = useContext(UserContext)
    const [rooms, setRooms] = useState([])
    const [modalRoomCreate, setModalRoomCreate] = useState(false)
    const [loading, setLoading] = useState(true)

    async function createRoom(room) {
        room.subscribers.push(user.pk)

        const data = await Fetch({ action: "api/room/", method: "POST", body: room })
        if (data && data.ok) {
            setRooms([data.room, ...rooms])
        }
        setModalRoomCreate(false)
    }

    useEffect(() => {
        setLoading(true)
        Fetch({ action: "api/room/", method: "GET" })
            .then((data) => {
                if (data && data.ok) {
                    setRooms(data.rooms)
                }
                setLoading(false)
            })
    }, [])

    return (
        <div className="Rooms">
            <MainComponents user={user} loading={loading} />

            <Modal modal={modalRoomCreate} setModal={setModalRoomCreate}>
                <ModalRoomCreate createRoom={createRoom} />
            </Modal>

            <Button onClick={() => setModalRoomCreate(true)} >add room</Button>

            <div className="list">
                {rooms.map((room) =>
                    <RoomCard key={room.id} room={room} link={`/chats/${user.username}/${room.id}/`} />
                )}
            </div>
        </div>
    )
}