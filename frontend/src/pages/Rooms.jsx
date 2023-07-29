import '../styles/Rooms.css'
import { useContext, useEffect, useState } from "react"
import { myFetch } from "../API/myFetch"
import { UserContext } from "../data/context"
import MainComponents from "../components/MainComponents"
import RoomCard from "../components/RoomCard"
import Modal from '../components/Modal'
import ModalRoomCreate from '../components/modals/ModalRoomCreate'
import Button from '../components/UI/Button'

export default function Rooms() {

    const { user } = useContext(UserContext)
    const [rooms, setRooms] = useState([])
    const [modalRoomCreate, setModalRoomCreate] = useState(false)
    const token = localStorage.getItem('token')

    async function createRoom(room) {
        room.subscribers.push(user.username)
        await myFetch({ action: 'api/room/', method: 'POST', body: room, token: token })
            .then((data) => {
                if (data.status) {
                    setRooms([data.room, ...rooms])
                }
            })
        setModalRoomCreate(false)
    }

    useEffect(() => {
        myFetch({ action: 'api/room/', method: 'GET', token: token })
            .then((data) => {
                if (data.status) {
                    setRooms(data.rooms)
                }
            })
    }, [])

    return (
        <div className="Rooms">

            <MainComponents user={user} />

            <Modal modal={modalRoomCreate} setModal={setModalRoomCreate}>
                <ModalRoomCreate createRoom={createRoom} />
            </Modal>

            <Button onClick={() => setModalRoomCreate(true)} >add room</Button>

            <div className='list'>
                {rooms.map((room) =>
                    <RoomCard key={room.id} room={room} link={`/chats/${user.username}/${room.id}/`} />
                )}
            </div>

        </div>
    )
}