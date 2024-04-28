import "./styles/RoomCard.css"
import { Link } from "react-router-dom"

export default function RoomCard({ room, link }) {

    function getSubstring({ text }) {
        if (text.length > 30) {
            text = text.substring(0, 30) + "..."
        }
        return text
    }

    return (
        <div className="RoomCard">
            <Link className="link" to={link}>
                <div className="content">
                    <div className="RoomName">
                        <h4>{room.name}</h4>
                    </div>
                    <br />
                    <div className="LastMessage">
                        {room.last_message_sender &&
                            <>
                                <strong>{room.last_message_sender}:</strong> {getSubstring({ text: room.last_message_text })}
                            </>
                        }
                    </div>
                </div>
            </Link>
        </div>
    )
}