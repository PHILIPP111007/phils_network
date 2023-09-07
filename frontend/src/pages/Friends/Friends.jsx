import "./styles/Friends.css"
import { useContext, useState } from "react"
import { UserContext } from "../../data/context"
import Fetch from "../../API/Fetch"
import MainComponents from "../components/MainComponents/MainComponents"
import FriendCard from "../components/FriendCard"
import FriendsNavBar from "../components/FriendsNavBar"
import FindUser from "../components/FindUser"
import Loading from "../components/Loading"

export default function Friends() {

    const { user } = useContext(UserContext)
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)

    async function findFunc(findUser) {
        setUsers([])
        if (findUser.username || findUser.first_name || findUser.last_name) {
            setLoading(true)

            const data = await Fetch({ action: "api/find/", method: "POST", body: findUser })
            if (data && data.ok) {
                setUsers(data.users)
            }
            setLoading(false)
        }
    }

    function showUsers() {
        if (users.length > 0) {
            return (
                <div>
                    <h3>Found: {users.length}</h3>
                    {users.map(user =>
                        <FriendCard key={user.username} user={user} />
                    )}
                </div>
            )
        }
    }

    return (
        <div className="Friends">
            <MainComponents user={user} />

            <FriendsNavBar />

            <FindUser findFunc={findFunc} />

            <div className="friends-section">
                <div id="friends" className="section">
                    {loading
                        ? <Loading />
                        : showUsers()
                    }
                </div>
            </div>
        </div>
    )
}