import "./styles/Friends.css"
import { useContext, useState } from "react"
import { useParams } from "react-router-dom"
import { UserContext, AuthContext } from "@data/context"
import { HttpMethod } from "@data/enums"
import { useAuth, useSetUser } from "@hooks/useAuth"
import rememberPage from "@modules/rememberPage"
import Fetch from "@API/Fetch"
import MainComponents from "@pages/components/MainComponents/MainComponents"
import FriendCard from "@pages/components/FriendCard"
import FriendsNavBar from "@pages/components/FriendsNavBar"
import FindUser from "@pages/components/FindUser"
import Loading from "@pages/components/Loading"
import ScrollToTopOrBottom from "@pages/components/MainComponents/components/ScrollToTopOrBottom"

export default function Friends() {

    rememberPage("/friends/")

    const { setIsAuth } = useContext(AuthContext)
    const { user, setUser } = useContext(UserContext)
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const params = useParams()

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