import "../styles/Friends.css"
import { useEffect, useState, useContext } from "react"
import { UserContext } from "../data/context"
import { useFriends } from "../hooks/useFriends"
import { UserSection } from "../hooks/UserSection"
import FriendCard from "../components/FriendCard"
import FriendsNavBar from "../components/FriendsNavBar"
import MainComponents from "../components/MainComponents"
import FindUser from "../components/FindUser"
import Loading from "../components/Loading"

export default function FriendsSection() {

    const { user } = useContext(UserContext)
    const [friends, setFriends] = useState([])
    const [filter, setFilter] = useState({ username: "", first_name: "", last_name: "" })
    const searchedFriends = useFriends(friends, filter)  // custom hook
    const [loading, setLoading] = useState(true)

    function findFunc(query) {
        setFilter({ ...filter, ...query })
    }

    useEffect(() => {
        UserSection({ option: "friends", setUserSection: setFriends, setLoading: setLoading })
    }, [])

    return (
        <div className="Friends">

            <MainComponents user={user} />

            <FriendsNavBar />

            <FindUser findFunc={findFunc} />

            <div className="friends-section">
                <div id="friends" className="section">
                    <h3>Friends: {searchedFriends.length}</h3>
                    {loading
                        ? <Loading />
                        :
                        searchedFriends.map(user =>
                            <FriendCard key={user.username} user={user} />
                        )
                    }
                </div>
            </div>
        </div>
    )
}