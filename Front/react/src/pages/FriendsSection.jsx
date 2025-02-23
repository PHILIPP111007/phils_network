import "./Friends/styles/Friends.css"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { FilterOption } from "@data/enums"
import rememberPage from "@modules/rememberPage"
import useFriends from "@hooks/useFriends"
import UserSection from "@hooks/UserSection"
import MainComponents from "@pages/components/MainComponents/MainComponents"
import FriendCard from "@pages/components/FriendCard"
import FriendsNavBar from "@pages/components/FriendsNavBar"
import FindUser from "@pages/components/FindUser"
import ScrollToTopOrBottom from "@pages/components/MainComponents/components/ScrollToTopOrBottom"

export default function FriendsSection() {

    var params = useParams()
    rememberPage(`friends/${params.username}/friends-section/`)

    var [friends, setFriends] = useState([])
    var [filter, setFilter] = useState({ username: "", first_name: "", last_name: "" })
    var searchedFriends = useFriends(friends, filter)  // custom hook
    var [loading, setLoading] = useState(true)

    async function findFunc(query) {
        setFilter({ ...filter, ...query })
    }

    useEffect(() => {
        UserSection({ option: FilterOption.FRIENDS, setUserSection: setFriends, setLoading: setLoading })
    }, [])

    return (
        <div className="Friends">
            <MainComponents loading={loading} />

            <ScrollToTopOrBottom bottom={false} />

            <FriendsNavBar />

            <FindUser findFunc={findFunc} />

            <div className="friends-section">
                <div id="friends" className="section">
                    <h3>Friends: {searchedFriends.length}</h3>
                    {searchedFriends.map(user =>
                        <FriendCard key={user.username} user={user} />
                    )}
                </div>
            </div>
        </div>
    )
}