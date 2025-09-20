import "./styles/RoomNavBar.css"
import { use, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { UserContext } from "../../../data/context.js"
import { HttpMethod, CacheKeys, Language } from "../../../data/enums.js"
import Fetch from "../../../API/Fetch.js"

export default function RoomNavBar() {

    var { user } = use(UserContext)
    var [roomInvitationsLength, setRoomInvitationsLength] = useState(0)
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    useEffect(() => {
        Fetch({ action: "api/v2/invite_chats/", method: HttpMethod.GET })
            .then((data) => {
                if (data && data.ok) {
                    setRoomInvitationsLength(data.room_invitations.length)
                }
            })
    }, [])

    if (language === Language.EN) {
        return (
            <aside className="RoomNavBar">
                <nav>
                    <p>
                        <Link to={`/invite_chats/${user.username}/`}>Invitation to chats <strong id="roomInvitationsLength" >{roomInvitationsLength}</strong></Link>
                    </p>
                </nav>
            </aside>
        )
    } else if (language === Language.RU) {
        return (
            <aside className="RoomNavBar">
                <nav>
                    <p>
                        <Link to={`/invite_chats/${user.username}/`}>Приглашение в чаты <strong id="roomInvitationsLength" >{roomInvitationsLength}</strong></Link>
                    </p>
                </nav>
            </aside>
        )
    }
}