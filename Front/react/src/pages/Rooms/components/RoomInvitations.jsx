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

    rememberPage(`invite_chats/${user.username}`)


    async function add_room(room_id) {
        await Fetch({ action: `api/v2/invite_chats/${user.id}/add_room/${room_id}/`, method: HttpMethod.POST })
            .then((data) => {
                if (data && data.ok) {
                    setRoomInvitations((prev) => {
                        var newRooms = [...prev.filter((roomInvitation) => roomInvitation.room.id !== room_id)]
                        return newRooms
                    })
                }
            })
    }

    async function remove_room(room_id) {
        await Fetch({ action: `api/v2/invite_chats/${user.id}/remove_room/${room_id}/`, method: HttpMethod.POST })
            .then((data) => {
                if (data && data.ok) {
                    setRoomInvitations((prev) => {
                        var newRooms = [...prev.filter((roomInvitation) => roomInvitation.room.id !== room_id)]
                        return newRooms
                    })
                }
            })
    }

    useEffect(() => {
        Fetch({ action: 'api/v2/invite_chats/', method: HttpMethod.GET })
            .then((data) => {
                if (data && data.ok) {
                    setRoomInvitations(data.room_invitations)
                }
            })
    }, [])

    return (
        <aside className="RoomInvitations">
            <MainComponents />

            {roomInvitations.map(room_invitation =>
                <RoomInvitationCard key={room_invitation.id} room_invitation={room_invitation} add_room={add_room} remove_room={remove_room} />
            )}

        </aside>
    )
}