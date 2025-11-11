import "./styles/NavBar.css"
import { use, useState, useEffect, useRef } from "react"
import { Link, useParams } from "react-router-dom"
import toast from "react-hot-toast"
import { getWebSocketDjango } from "../../../../modules/getWebSocket.js"
import Fetch from "../../../../API/Fetch.js"
import { notify } from "../../../../modules/notify.js"
import { HttpMethod, APIVersion } from "../../../../data/enums.js"
import { UserContext } from "../../../../data/context.js"
import { CacheKeys, Language } from "../../../../data/enums.js"

export default function NavBar() {

    var { user } = use(UserContext)
    var language = localStorage.getItem(CacheKeys.LANGUAGE)
    var [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
    var [rooms, setRooms] = useState([])
    var roomSocket = useRef(null)
    var params = useParams()

    async function getUnreadMessagesCount() {
        var data = await Fetch({ api_version: APIVersion.V2, action: "get_unread_message_count/", method: HttpMethod.GET })

        if (data && data.ok) {
            setUnreadMessagesCount(data.unread_messages_count)
        }
    }

    useEffect(() => {
        Fetch({ api_version: APIVersion.V2, action: "room/", method: HttpMethod.GET })
            .then((data) => {
                if (data && data.ok) {
                    setRooms(data.rooms)
                }
            })

    }, [])

    useEffect(() => {
        roomSocket.current = rooms.map((room) => {
            var socket = getWebSocketDjango({ socket_name: "roomSocketNavBar", path: `chat/${room.id}/${user.id}/` })
            socket.onmessage = (e) => {
                var data = JSON.parse(e.data)
                if (user.username !== data.message.sender.username && Number(params.room_id) !== room.id) {
                    var msg = ""
                    var username = data.message.sender.username
                    var text = data.message.text
                    var file_name = data.message.file.path

                    if (text) {
                        if (text.length > 30) {
                            text = text.substring(0, 30) + "..."
                        }
                        msg += text
                    }
                    if (file_name) {
                        if (file_name.length > 30) {
                            file_name = file_name.substring(0, 30) + "..."
                        }
                        if (text) {
                            msg += " " + file_name
                        } else {
                            msg += file_name
                        }
                    }

                    toast.remove()
                    notify(
                        <div className="Notification" >
                            <Link to={`/chats/${user.username}/${room.id}/`}><strong>{username}</strong>: {msg}</Link>
                        </div>
                    )

                    setUnreadMessagesCount((prev) => prev + 1)
                }
            }
            return {
                room_id: room.id,
                socket: socket
            }
        })
        return () => {
            roomSocket.current.map((room) => {
                room.socket.close()
            })
        }
    }, [rooms.length])

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
                        <Link to={`/video_stream/${user.username}/`}>Video conference</Link>
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
                        <Link to={`/video_stream/${user.username}/`}>Видео конференции</Link>
                    </p>
                    <p>
                        <Link to={`/w3/${user.username}/`}>W3</Link>
                    </p>
                </nav>
            </aside>
        )
    }
}