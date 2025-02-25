import "./styles/Friends.css"
import { useState } from "react"
import { useParams } from "react-router-dom"
import { HttpMethod } from "../../data/enums"
import rememberPage from "../../modules/rememberPage"
import Fetch from "../../API/Fetch"
import MainComponents from "../components/MainComponents/MainComponents"
import FriendCard from "../components/FriendCard"
import FriendsNavBar from "../components/FriendsNavBar"
import FindUser from "../components/FindUser"
import Loading from "../components/Loading"
import ScrollToTopOrBottom from "../components/MainComponents/components/ScrollToTopOrBottom"

export default function Friends() {

    var params = useParams()
    rememberPage(`friends/${params.username}`)


    var [users, setUsers] = useState([])
    var [loading, setLoading] = useState(false)

    async function findFunc(findUser) {
        setUsers([])
        if (findUser.username || findUser.first_name || findUser.last_name) {
            setLoading(true)

            var data = await Fetch({ action: "find/", method: HttpMethod.POST, body: findUser })
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


    return (
        <div className="Friends">
            <MainComponents />

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