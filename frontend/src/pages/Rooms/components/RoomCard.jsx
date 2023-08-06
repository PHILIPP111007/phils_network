import "./styles/RoomCard.css"
import { Link } from "react-router-dom"

export default function RoomCard({ room, link }) {
    return (
        <div className="RoomCard">
            <div className="link">
                <Link to={link} >
                    <div className="text">
                        <h4>{room.name}</h4>
                    </div>
                </Link>
            </div>
        </div>
    )
}