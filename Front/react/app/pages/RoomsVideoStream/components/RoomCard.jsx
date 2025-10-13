import "./styles/RoomCard.css"
import { Link } from "react-router-dom"

export default function RoomCard({ room, link }) {

    return (
        <div className="RoomCard">
            <Link className="link" to={link}>
                <div className="content">
                    <div className="RoomName">
                        <h4>{room.name}</h4>
                    </div>
                </div>
            </Link>
        </div>
    )
}