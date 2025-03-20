
import "./styles/RoomInvitationCard.css"
import { CacheKeys, Language } from "../../../../data/enums"
import Button from "../../../components/UI/Button"

export default function RoomInvitationCard({ room_invitation, add_room, remove_room }) {
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    if (language === Language.EN) {
        return (
            <div className="RoomInvitationCard">
                <div className="content">
                    <div className="RoomName">
                        <h4>{room_invitation.creator.username} invites you to a conversation {room_invitation.room.name}</h4>
                    </div>
                    <br />

                    <div className="UserBtns">
                        <Button onClick={() => {
                            add_room(room_invitation.room.id)
                        }
                        } >enter</Button>

                        <Button onClick={() => {
                            remove_room(room_invitation.room.id)
                        }
                        } >delete</Button>
                    </div>

                </div>
            </div>
        )
    } else if (language === Language.RU) {
        return (
            <div className="RoomInvitationCard">
                <div className="content">
                    <div className="RoomName">
                        <h4>{room_invitation.creator.username} приглашает вас в беседу {room_invitation.room.name}</h4>
                    </div>
                    <br />

                    <div className="UserBtns">
                        <Button onClick={() => {
                            add_room(room_invitation.room.id)
                        }
                        } >Войти</Button>

                        <Button onClick={() => {
                            remove_room(room_invitation.room.id)
                        }
                        } >Удалить</Button>
                    </div>

                </div>
            </div>
        )
    }
}