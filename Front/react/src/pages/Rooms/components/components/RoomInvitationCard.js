
import "./styles/RoomInvitationCard.css"
import { use } from "react"
import { HttpMethod } from "../../../../data/enums"
import Fetch from "../../../../API/Fetch"
import { UserContext } from "../../../../data/context"
import Button from "../../../components/UI/Button"

export default function RoomInvitationCard({ room, roomInvitations, setRoomInvitations }) {

    var { user } = use(UserContext)

    async function add_room(room_id) {
        await Fetch({ action: `invite_chats/${user.username}/add_room/${room_id}/`, method: HttpMethod.POST })
            .then((data) => {
                if (data && data.ok) {
                    setRoomInvitations((prev) => {
                        var newRooms = [roomInvitations, ...prev.filter((room) => room.id !== room_id)]
                        return newRooms
                    })
                }
            })
    }

    async function remove_room(room_id) {
        await Fetch({ action: `invite_chats/${user.username}/remove_room/${room_id}/`, method: HttpMethod.POST })
            .then((data) => {
                if (data && data.ok) {
                    if (data && data.ok) {
                        setRoomInvitations((prev) => {
                            var newRooms = [roomInvitations, ...prev.filter((room) => room.id !== room_id)]
                            return newRooms
                        })
                    }
                }
            })
    }

    return (
        <div className="RoomInvitationCard">
            <div className="content">
                <div className="RoomName">
                    <h4>{room.creator.username} invites you to a conversation {room.room.name}</h4>
                </div>
                <br />

                <div className="UserBtns">
                    <Button onClick={() => {
                        add_room(room.id)
                    }
                    } >enter</Button>

                    <Button onClick={() => {
                        remove_room(room.id)
                    }
                    } >delete</Button>
                </div>

            </div>
        </div>
    )
}