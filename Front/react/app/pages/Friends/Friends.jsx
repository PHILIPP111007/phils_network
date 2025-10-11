import "./styles/Friends.css"
import { useState } from "react"
import { useParams } from "react-router-dom"
import { HttpMethod, CacheKeys, Language } from "../../data/enums.js"
import rememberPage from "../../modules/rememberPage.js"
import Fetch from "../../API/Fetch.js"
import MainComponents from "../components/MainComponents/MainComponents.jsx"
import FriendCard from "../components/FriendCard.jsx"
import FriendsNavBar from "../components/FriendsNavBar.jsx"
import FindUser from "../components/FindUser.jsx"
import Loading from "../components/Loading.jsx"
import ScrollToTopOrBottom from "../components/MainComponents/components/ScrollToTopOrBottom.jsx"

export default function Friends() {

    var params = useParams()
    var language = localStorage.getItem(CacheKeys.LANGUAGE)
    var [users, setUsers] = useState([])
    var [loading, setLoading] = useState(false)
    rememberPage(`friends/${params.username}`)

    async function findFunc(findUser) {
        setUsers([])
        if (findUser.username || findUser.first_name || findUser.last_name) {
            setLoading(true)

            var data = await Fetch({ api_version: 2, action: "find_user/", method: HttpMethod.POST, body: findUser })
            if (data && data.ok) {
                setUsers(data.users)
            }
            setLoading(false)
        }
    }

    function showUsers() {
        if (users.length > 0) {
            if (language === Language.EN) {
                return (
                    <>
                        <h3>Found: {users.length}</h3>
                        {users.map(user =>
                            <FriendCard key={user.username} user={user} />
                        )}
                    </>
                )
            } else if (language === Language.RU) {
                return (
                    <>
                        <h3>Найдено: {users.length}</h3>
                        {users.map(user =>
                            <FriendCard key={user.username} user={user} />
                        )}
                    </>
                )
            }
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