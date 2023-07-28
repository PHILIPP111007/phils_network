import '../styles/RoomCard.css'

export default function RoomCard(props) {
    return (
        <div className="RoomCard">
            <h4>{props.room.name}</h4>
        </div>
    )
}