import "../styles/Friends.css"
import { useContext, useState } from "react"
import { UserContext } from "../data/context"
import { myFetch } from "../API/myFetch"
import MainComponents from "../components/MainComponents"
import FriendCard from "../components/FriendCard"
import FriendsNavBar from "../components/FriendsNavBar"
import FindUser from "../components/FindUser"
import Loading from "../components/Loading"

export default function Friends() {

    const { user } = useContext(UserContext)
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const token = localStorage.getItem("token")

    async function findFunc(findUser) {
        setUsers([])
        if (findUser.username || findUser.first_name || findUser.last_name) {
            setLoading(true)
            await myFetch({ action: "api/find/", method: "POST", body: findUser, token: token })
                .then((data) => {
                    if (data.status) {
                        setUsers(data.users)
                    }
                    setLoading(false)
                })
        }
    }

    function showUsers() {
        if (users.length > 0) {
            return (
                <div>
                    <h3>Found: {users.length}</h3>
                    {
                        users.map(user =>
                            <FriendCard key={user.username} user={user} />
                        )
                    }
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