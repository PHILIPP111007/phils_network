import "./styles/RoomInvitations.css"
import { use, useState, useEffect } from "react"
import { HttpMethod } from "../../../data/enums.js"
import Fetch from "../../../API/Fetch.js"
import { UserContext } from "../../../data/context.js"
import rememberPage from "../../../modules/rememberPage.js"
import MainComponents from "../../components/MainComponents/MainComponents.jsx"
import RoomInvitationCard from "./components/RoomInvitationCard.jsx"

export default function RoomInvitations() {

    var { user } = use(UserContext)
    var [roomInvitations, setRoomInvitations] = useState([])

    rememberPage(`invite_chats/${user.username}`)


    async function add_room(room_id) {
        await Fetch({ api_version: 2, action: `invite_chats/${user.id}/add_room/${room_id}/`, method: HttpMethod.POST })
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
        await Fetch({ api_version: 2, action: `invite_chats/${user.id}/remove_room/${room_id}/`, method: HttpMethod.POST })
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
        Fetch({ api_version: 2, action: "invite_chats/", method: HttpMethod.GET })
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