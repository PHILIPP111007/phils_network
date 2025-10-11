import "./Friends/styles/Friends.css"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { FilterOption, CacheKeys, Language } from "../data/enums.js"
import rememberPage from "../modules/rememberPage.js"
import useFriends from "../hooks/useFriends.js"
import UserSection from "../hooks/UserSection.js"
import MainComponents from "./components/MainComponents/MainComponents.jsx"
import FriendCard from "./components/FriendCard.jsx"
import FriendsNavBar from "./components/FriendsNavBar.jsx"
import FindUser from "./components/FindUser.jsx"
import ScrollToTopOrBottom from "./components/MainComponents/components/ScrollToTopOrBottom.jsx"

export default function SubscriptionsSection() {

    var params = useParams()
    rememberPage(`friends/${params.username}/subscriptions-section`)

    var [subscriptions, setSubscriptions] = useState([])
    var [filter, setFilter] = useState({ username: "", first_name: "", last_name: "" })
    var searchedSubscriptions = useFriends(subscriptions, filter)  // custom hook
    var [loading, setLoading] = useState(true)
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    async function findFunc(query) {
        setFilter({ ...filter, ...query })
    }

    useEffect(() => {
        UserSection({ option: FilterOption.SUBSCRIPTIONS, setUserSection: setSubscriptions, setLoading: setLoading })
    }, [])


    if (language === Language.EN) {
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
    } else if (language === Language.RU) {
        return (
            <div className="Friends">
                <MainComponents loading={loading} />

                <ScrollToTopOrBottom bottom={false} />

                <FriendsNavBar />

                <FindUser findFunc={findFunc} />

                <div className="friends-section">
                    <div id="subscriptions" className="section">
                        <h3>Подписки: {searchedSubscriptions.length}</h3>
                        {searchedSubscriptions.map(user =>
                            <FriendCard key={user.username} user={user} />
                        )}
                    </div>
                </div>
            </div>
        )
    }
}