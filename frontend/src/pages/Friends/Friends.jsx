import "./styles/Friends.css"
import { useContext, useState } from "react"
import { UserContext, AuthContext } from "../../data/context"
import { useParams } from "react-router-dom"
import { HttpMethod } from "../../data/enums"
import { useAuth, useSetUser } from "../../hooks/useAuth"
import Fetch from "../../API/Fetch"
import MainComponents from "../components/MainComponents/MainComponents"
import FriendCard from "../components/FriendCard"
import FriendsNavBar from "../components/FriendsNavBar"
import FindUser from "../components/FindUser"
import Loading from "../components/Loading"
import ScrollToTopOrBottom from "../components/MainComponents/components/ScrollToTopOrBottom"

export default function Friends() {

    const { setIsAuth } = useContext(AuthContext)
    const { user, setUser } = useContext(UserContext)
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const params = useParams()

    localStorage.setItem("path", "/friends/")

    async function findFunc(findUser) {
        setUsers([])
        if (findUser.username || findUser.first_name || findUser.last_name) {
            setLoading(true)

            const data = await Fetch({ action: "api/find/", method: HttpMethod.POST, body: findUser })
            if (data && data.ok) {
                setUsers(data.users)
            }
            setLoading(false)
        }
    }

    function showUsers() {
        if (users.length > 0) {
            return (
                <>
                    <h3>Found: {users.length}</h3>
                    {users.map(user =>
                        <FriendCard key={user.username} user={user} />
                    )}
                </>
            )
        }
    }

    useAuth({ username: params.username, setIsAuth: setIsAuth })

    useSetUser({ username: params.username, setUser: setUser })

    return (
        <div className="Friends">
            <MainComponents user={user} />

            <ScrollToTopOrBottom bottom={false} />

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