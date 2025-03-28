import "./Friends/styles/Friends.css"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { FilterOption, CacheKeys, Language } from "../data/enums"
import rememberPage from "../modules/rememberPage"
import useFriends from "../hooks/useFriends"
import UserSection from "../hooks/UserSection"
import MainComponents from "./components/MainComponents/MainComponents"
import FriendCard from "./components/FriendCard"
import FriendsNavBar from "./components/FriendsNavBar"
import FindUser from "./components/FindUser"
import ScrollToTopOrBottom from "./components/MainComponents/components/ScrollToTopOrBottom"

export default function SubscribersSection() {

    var params = useParams()
    rememberPage(`friends/${params.username}/subscribers-section`)

    var [subscribers, setSubscribers] = useState([])
    var [filter, setFilter] = useState({ username: "", first_name: "", last_name: "" })
    var searchedSubscribers = useFriends(subscribers, filter)  // custom hook
    var [loading, setLoading] = useState(true)
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    async function findFunc(query) {
        setFilter({ ...filter, ...query })
    }

    useEffect(() => {
        UserSection({ option: FilterOption.SUBSCRIBERS, setUserSection: setSubscribers, setLoading: setLoading })
    }, [])

    if (language === Language.EN) {
        return (
            <div className="Friends">
                <MainComponents loading={loading} />

                <ScrollToTopOrBottom bottom={false} />

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
    } else if (language === Language.RU) {
        return (
            <div className="Friends">
                <MainComponents loading={loading} />

                <ScrollToTopOrBottom bottom={false} />

                <FriendsNavBar />

                <FindUser findFunc={findFunc} />

                <div className="friends-section">
                    <div id="subscribers" className="section">
                        <h3>Подписчики: {searchedSubscribers.length}</h3>
                        {searchedSubscribers.map(user =>
                            <FriendCard key={user.username} user={user} />
                        )}
                    </div>
                </div>
            </div>
        )
    }
}