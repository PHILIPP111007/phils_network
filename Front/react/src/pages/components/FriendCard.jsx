import "./styles/FriendCard.css"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getFileUrl } from "../../modules/getFileUrl.js"
import { CacheKeys, Language } from "../../data/enums.js"
import UserStatus from "./UserStatus.jsx"
import showOnlineStatus from "../../modules/showOnlineStatus.jsx"

export default function FriendCard({ user }) {

    var [status, setStatus] = useState("")
    var [userImageUrl, setUserImageUrl] = useState(null)
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    useEffect(() => {
        if (user.image) {
            var url = getFileUrl(user.image)
            setUserImageUrl(url)
        }
    }, [])

    if (language === Language.EN) {
        return (
            <div className="FriendCard">
                <Link to={`/users/${user.username}/`} >
                    {userImageUrl &&
                        <img 
                            className="FriendCardUserImage"
                            src={userImageUrl} 
                            alt="user image" 
                        />
                    }
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
                    {userImageUrl &&
                        <img 
                            className="FriendCardUserImage"
                            src={userImageUrl} 
                            alt="user image" 
                        />
                    }
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