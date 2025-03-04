import "./styles/RoomNavBar.css"
import { use, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { UserContext } from "../../../data/context"
import Fetch from "../../../API/Fetch"
import { HttpMethod } from "../../../data/enums"

export default function RoomNavBar() {

    var { user } = use(UserContext)
    var [roomInvitations, setRoomInvitations] = useState([])

    useEffect(() => {
        Fetch({ action: `api/v2/invite_chats/${user.username}/`, method: HttpMethod.GET })
            .then((data) => {
                if (data && data.ok) {
                    setRoomInvitations(data.rooms)
                }
            })
    }, [])


    return (
        <aside className="RoomNavBar">
            <nav>
                <p>
                    <Link to={`/invite_chats/${user.username}/`}>Invite chats <strong id="roomInvitations_length" >{roomInvitations.length}</strong></Link>
                </p>
            </nav>
        </aside>
    )
}