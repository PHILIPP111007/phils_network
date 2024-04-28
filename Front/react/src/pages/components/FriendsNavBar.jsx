import "./styles/FriendsNavBar.css"
import { useContext, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { FilterOption, HttpMethod } from "../../data/enums"
import { UserContext } from "../../data/context"
import Fetch from "../../API/Fetch"

export default function FriendsNavBar() {

    var { user } = useContext(UserContext)
    var [subscribersCount, setSubscribersCount] = useState(0)

    useEffect(() => {
        Fetch({ action: `api/friends/${FilterOption.SUBSCRIBERS_COUNT}/`, method: HttpMethod.GET })
            .then((data) => {
                if (data && data.ok) {
                    setSubscribersCount(data.query)
                }
            })
    }, [])

    return (
        <aside className="FriendsNavBar">
            <nav>
                <p>
                    <Link to={`/friends/${user.username}/friends-section/`}>friends</Link>
                </p>
                <p>
                    <Link to={`/friends/${user.username}/subscribers-section/`}>
                        subscribers {subscribersCount !== 0 && <strong className="subscribersCount" >{subscribersCount}</strong>}
                    </Link>
                </p>
                <p>
                    <Link to={`/friends/${user.username}/subscriptions-section/`}>subscriptions</Link>
                </p>
            </nav>
        </aside>
    )
}