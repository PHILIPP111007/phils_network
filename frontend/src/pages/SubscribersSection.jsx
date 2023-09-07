import "./Friends/styles/Friends.css"
import { useEffect, useState, useContext } from "react"
import { UserContext } from "../data/context"
import useFriends from "../hooks/useFriends"
import UserSection from "../hooks/UserSection"
import MainComponents from "./components/MainComponents/MainComponents"
import FriendCard from "./components/FriendCard"
import FriendsNavBar from "./components/FriendsNavBar"
import FindUser from "./components/FindUser"

export default function SubscribersSection() {

    const { user } = useContext(UserContext)
    const [subscribers, setSubscribers] = useState([])
    const [filter, setFilter] = useState({ username: "", first_name: "", last_name: "" })
    const searchedSubscribers = useFriends(subscribers, filter)  // custom hook
    const [loading, setLoading] = useState(true)

    async function findFunc(query) {
        setFilter({ ...filter, ...query })
    }

    useEffect(() => {
        UserSection({ option: "subscribers", setUserSection: setSubscribers, setLoading: setLoading })
    }, [])

    return (
        <div className="Friends">
            <MainComponents user={user} loading={loading} />

            <FriendsNavBar />

            <FindUser findFunc={findFunc} />

            <div className="friends-section">
                <div id="subscribers" className="section">
                    <h3>Subscribers: {searchedSubscribers.length}</h3>
                    {searchedSubscribers.map(user =>
                        <FriendCard key={user.username} user={user} />
                    )}
                </div>
            </div>
        </div>
    )
}