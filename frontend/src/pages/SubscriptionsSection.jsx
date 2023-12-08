import "./Friends/styles/Friends.css"
import { useEffect, useState, useContext } from "react"
import { FilterOption } from "@data/enums"
import { UserContext } from "@data/context"
import useFriends from "@hooks/useFriends"
import UserSection from "@hooks/UserSection"
import MainComponents from "@pages/components/MainComponents/MainComponents"
import FriendCard from "@pages/components/FriendCard"
import FriendsNavBar from "@pages/components/FriendsNavBar"
import FindUser from "@pages/components/FindUser"
import ScrollToTopOrBottom from "@pages/components/MainComponents/components/ScrollToTopOrBottom"

export default function SubscriptionsSection() {

    var { user } = useContext(UserContext)
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
            <MainComponents user={user} loading={loading} />

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