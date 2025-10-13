import "./styles/RoomsVideoStream.css"
import { use, useState, useEffect, useMemo } from "react"
import { useParams } from "react-router-dom"
import { HttpMethod, APIVersion } from "../../data/enums.js"
import { UserContext } from "../../data/context.js"
import rememberPage from "../../modules/rememberPage.js"
import Fetch from "../../API/Fetch.js"
import MainComponents from "../components/MainComponents/MainComponents.jsx"
import RoomCard from "./components/RoomCard.jsx"

export default function RoomsVideoStream() {

    var { user } = use(UserContext)
    var [loading, setLoading] = useState(true)
    var [rooms, setRooms] = useState([])
    var params = useParams()

    rememberPage(`video_stream/${params.username}`)

    async function getRooms() {
        setLoading(true)
        await Fetch({ api_version: APIVersion.V2, action: "room/", method: HttpMethod.GET })
            .then((data) => {
                if (data && data.ok) {
                    setRooms(data.rooms)
                }
            })
        setLoading(false)
    }

    var showRooms = useMemo(() => {
        return (
            rooms.map((room) =>
                <RoomCard
                    key={room.id}
                    room={room}
                    link={`/video_stream/${user.username}/${room.id}/`}
                />
            )
        )
    }, [rooms])

    useEffect(() => {
        getRooms()
    }, [])

    return (
        <div className="RoomsVideoStream">
            <MainComponents loading={loading} />

            <div className="list">
                {showRooms}
            </div>
        </div>
    )
}