
import "./styles/RoomInvitationCard.css"
import Button from "../../../components/UI/Button"

export default function RoomInvitationCard({ room, add_room, remove_room }) {
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