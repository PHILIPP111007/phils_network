import "./Friends/styles/Friends.css"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { FilterOption } from "../data/enums"
import rememberPage from "../modules/rememberPage"
import useFriends from "../hooks/useFriends"
import UserSection from "../hooks/UserSection"
import MainComponents from "./components/MainComponents/MainComponents"
import FriendCard from "./components/FriendCard"
import FriendsNavBar from "./components/FriendsNavBar"
import FindUser from "./components/FindUser"
import ScrollToTopOrBottom from "./components/MainComponents/components/ScrollToTopOrBottom"

export default function SubscriptionsSection() {

    var params = useParams()
    rememberPage(`friends/${params.username}/subscriptions-section`)

    var [subscriptions, setSubscriptions] = useState([])
    var [filter, setFilter] = useState({ username: "", first_name: "", last_name: "" })
    var searchedSubscriptions = useFriends(subscriptions, filter)  // custom hook
    var [loading, setLoading] = useState(true)

    async function findFunc(query) {
        setFilter({ ...filter, ...query })
    }

    useEffect(() => {
        UserSection({ option: FilterOption.SUBSCRIPTIONS, setUserSection: setSubscriptions, setLoading: setLoading })
    }, [])

    return (
        <div className="Friends">
            <MainComponents loading={loading} />

            <ScrollToTopOrBottom bottom={false} />

            <FriendsNavBar />

            <FindUser findFunc={findFunc} />

            <div className="friends-section">
                <div id="subscriptions" className="section">
                    <h3>Subscriptions: {searchedSubscriptions.length}</h3>
                    {searchedSubscriptions.map(user =>
                        <FriendCard key={user.username} user={user} />
                    )}
                </div>
            </div>
        </div>
    )
}