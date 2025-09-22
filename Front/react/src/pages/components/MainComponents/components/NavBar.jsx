import "./styles/NavBar.css"
import { use, useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Fetch from "../../../../API/Fetch.js"
import { HttpMethod } from "../../../../data/enums.js"
import { UserContext } from "../../../../data/context.js"
import { CacheKeys, Language } from "../../../../data/enums.js"

export default function NavBar() {

    var { user } = use(UserContext)
    var language = localStorage.getItem(CacheKeys.LANGUAGE)
    var [unreadMessagesCount, setUnreadMessagesCount] = useState(0)

    async function getUnreadMessagesCount() {
        var data = await Fetch({ action: `api/v2/get_unread_message_count/`, method: HttpMethod.GET })

        if (data && data.ok) {
            setUnreadMessagesCount(data.unread_messages_count)
        }
    }

    useEffect(() => {
        getUnreadMessagesCount()
    }, [])

    if (language === Language.EN) {
        return (
            <aside className="NavBar">
                <nav>
                    <p>
                        <Link to={`/users/${user.username}/`}>User</Link>
                    </p>
                    <p>
                        <Link to={`/chats/${user.username}/`}>Chats {unreadMessagesCount > 0 && <div className="unreadMessagesCount">{unreadMessagesCount}</div>}</Link>
                    </p>
                    <p>
                        <Link to={`/news/${user.username}/`}>News</Link>
                    </p>
                    <p>
                        <Link to={`/friends/${user.username}/`}>Friends</Link>
                    </p>
                    <p>
                        <Link to={`/w3/${user.username}/`}>W3</Link>
                    </p>
                </nav>
            </aside>
        )
    } else if (language === Language.RU) {
        return (
            <aside className="NavBar">
                <nav>
                    <p>
                        <Link to={`/users/${user.username}/`}>Пользователь</Link>
                    </p>
                    <p>
                        <Link to={`/chats/${user.username}/`}>Чаты {unreadMessagesCount > 0 && <div className="unreadMessagesCount">{unreadMessagesCount}</div>}</Link>
                    </p>
                    <p>
                        <Link to={`/news/${user.username}/`}>Новости</Link>
                    </p>
                    <p>
                        <Link to={`/friends/${user.username}/`}>Друзья</Link>
                    </p>
                    <p>
                        <Link to={`/w3/${user.username}/`}>W3</Link>
                    </p>
                </nav>
            </aside>
        )
    }
}