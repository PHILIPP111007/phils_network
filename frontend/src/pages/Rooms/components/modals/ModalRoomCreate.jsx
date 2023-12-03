import "./styles/ModalRoomCreate.css"
import { useEffect, useState } from "react"
import UserSection from "@hooks/UserSection"
import Loading from "@pages/components/Loading"
import Button from "@pages/components/UI/Button"
import Input from "@pages/components/UI/Input"

export default function ModalRoomCreate(props) {

    var [room, setRoom] = useState({ name: "", subscribers: [] })
    var [friends, setFriends] = useState([])
    var [loading, setLoading] = useState(true)

    function friendsShow() {
        return friends.map((user) =>

            <div key={user.username} className="card">
                <div className="info">
                    <div>{user.first_name} {user.last_name} @{user.username}</div>
                </div>

                {room.subscribers.filter(pk => pk === user.pk).length === 0
                    ?
                    <Button onClick={() => setRoom({ ...room, subscribers: [...room.subscribers, user.pk] })} >add</Button>
                    :
                    <Button onClick={() => setRoom({ ...room, subscribers: room.subscribers.filter(pk => pk !== user.pk) })} >delete</Button>
                }
            </div>
        )
    }

    useEffect(() => {
        UserSection({ option: "friends", setUserSection: setFriends, setLoading: setLoading })
    }, [])

    return (
        <div className="ModalRoomCreate">

            <Button onClick={() => {
                if (room.name.length > 0) {
                    props.createRoom(room)
                }
                setRoom({ name: "", subscribers: [] })
            }} >create</Button>

            <br />
            <br />

            <Input
                type="text"
                placeholder="room name"
                maxLength="50"
                value={room.name}
                onChange={(e) => setRoom({ ...room, name: e.target.value })}
            />

            <br />
            <br />

            {friendsShow()}
            {loading && <Loading />}
        </div>
    )
}