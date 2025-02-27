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

    useEffect(() => {
        Fetch({ action: `invite_chats/${user.username}`, method: HttpMethod.GET })
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
                <RoomInvitationCard key={room.id} room={room} roomInvitations={roomInvitations} setRoomInvitations={setRoomInvitations} />
            )}

        </aside>
    )
}