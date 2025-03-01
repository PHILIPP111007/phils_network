import "./styles/FriendCard.css"
import { useState } from "react"
import { Link } from "react-router-dom"
import UserStatus from "./UserStatus"
import showOnlineStatus from "../../modules/showOnlineStatus"

export default function FriendCard({ user }) {

    var [status, setStatus] = useState("")

    return (
        <div className="FriendCard">
            <Link to={`/users/${user.username}/`} >
                <div className="info">
                    <div className="name">
                        {user.first_name ? user.first_name : "No name"} {user.last_name ? user.last_name : "No name"}
                    </div>

                    <div className="username">
                        @{user.username} {showOnlineStatus({ user: user })}
                    </div>
                </div>
            </Link>
            <div className="UserBtns">
                <UserStatus pk={user.pk} status={status} setStatus={setStatus} />
            </div>
        </div>
    )
}