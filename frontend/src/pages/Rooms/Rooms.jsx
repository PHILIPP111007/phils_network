import "./styles/Rooms.css"
import { useContext, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { UserContext, AuthContext } from "@data/context"
import { HttpMethod } from "@data/enums"
import { useAuth, useSetUser } from "@hooks/useAuth"
import Fetch from "@API/Fetch"
import ModalRoomCreate from "@pages/Rooms/components/modals/ModalRoomCreate"
import RoomCard from "@pages/Rooms/components/RoomCard"
import MainComponents from "@pages/components/MainComponents/MainComponents"
import Modal from "@pages/components/Modal"
import ScrollToTopOrBottom from "@pages/components/MainComponents/components/ScrollToTopOrBottom"
import Button from "@pages/components/UI/Button"

export default function Rooms() {

    const { setIsAuth } = useContext(AuthContext)
    const { user, setUser } = useContext(UserContext)
    const [rooms, setRooms] = useState([])
    const [modalRoomCreate, setModalRoomCreate] = useState(false)
    const [loading, setLoading] = useState(true)
    const params = useParams()

    localStorage.setItem("path", "/chats/")

    async function createRoom(room) {
        room.subscribers.push(user.pk)

        const data = await Fetch({ action: "api/room/", method: HttpMethod.POST, body: room })
        if (data && data.ok) {
            setRooms([data.room, ...rooms])
        }
        setModalRoomCreate(false)
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
                {rooms.map((room) =>
                    <RoomCard key={room.id} room={room} link={`/chats/${user.username}/${room.id}/`} />
                )}
            </div>
        </div>
    )
}