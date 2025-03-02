import "./styles/RoomInvitations.css"
import { use, useState, useEffect } from "react"
import { HttpMethod } from "../../../data/enums"
import Fetch from "../../../API/Fetch"
import { UserContext } from "../../../data/context"
import rememberPage from "../../../modules/rememberPage"
import MainComponents from "../../components/MainComponents/MainComponents"
import RoomInvitationCard from "./components/RoomInvitationCard"

export default function RoomInvitations() {

    var { user } = use(UserContext)
    var [roomInvitations, setRoomInvitations] = useState([])

    rememberPage(`invite_chats/${user.username}/`)


    async function add_room(room_id) {
        await Fetch({ action: `api/v1/invite_chats/${user.username}/add_room/${room_id}/`, method: HttpMethod.POST })
            .then((data) => {
                if (data && data.ok) {
                    setRoomInvitations((prev) => {
                        var newRooms = [...prev.filter((room) => room.id !== room_id)]
                        return newRooms
                    })
                }
            })
    }

    async function remove_room(room_id) {
        await Fetch({ action: `api/v1/invite_chats/${user.username}/remove_room/${room_id}/`, method: HttpMethod.POST })
            .then((data) => {
                if (data && data.ok) {
                    if (data && data.ok) {
                        setRoomInvitations((prev) => {
                            var newRooms = [...prev.filter((room) => room.id !== room_id)]
                            return newRooms
                        })
                    }
                }
            })
    }

    useEffect(() => {
        Fetch({ action: `api/v1/invite_chats/${user.username}`, method: HttpMethod.GET })
            .then((data) => {
                if (data && data.ok) {
                    setRoomInvitations(data.rooms)
                }
            })
    }, [])

    return (
        <aside className="RoomInvitations">
            <MainComponents />

            {roomInvitations.map(room =>
                <RoomInvitationCard key={room.id} room={room} add_room={add_room} remove_room={remove_room} />
            )}

        </aside>
    )
}