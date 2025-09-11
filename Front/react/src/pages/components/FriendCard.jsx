import "./styles/FriendCard.css"
import { useState } from "react"
import { Link } from "react-router-dom"
import { CacheKeys, Language } from "../../data/enums.js"
import UserStatus from "./UserStatus.jsx"
import showOnlineStatus from "../../modules/showOnlineStatus.jsx"

export default function FriendCard({ user }) {

    var [status, setStatus] = useState("")
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    if (language === Language.EN) {
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
                    <UserStatus id={user.id} status={status} setStatus={setStatus} />
                </div>
            </div>
        )
    } else if (language === Language.RU) {
        return (
            <div className="FriendCard">
                <Link to={`/users/${user.username}/`} >
                    <div className="info">
                        <div className="name">
                            {user.first_name ? user.first_name : "Нет имени"} {user.last_name ? user.last_name : "Нет имени"}
                        </div>

                        <div className="username">
                            @{user.username} {showOnlineStatus({ user: user })}
                        </div>
                    </div>
                </Link>
                <div className="UserBtns">
                    <UserStatus id={user.id} status={status} setStatus={setStatus} />
                </div>
            </div>
        )
    }
}