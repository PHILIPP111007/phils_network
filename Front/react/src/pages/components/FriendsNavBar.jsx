import "./styles/FriendsNavBar.css"
import { useEffect, useState, use } from "react"
import { Link } from "react-router-dom"
import { FilterOption, HttpMethod, CacheKeys, Language } from "../../data/enums.js"
import { UserContext } from "../../data/context.js"
import Fetch from "../../API/Fetch.js"

export default function FriendsNavBar() {

    var { user } = use(UserContext)
    var [subscribersCount, setSubscribersCount] = useState(0)
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    useEffect(() => {
        Fetch({ action: `api/v2/friends/${FilterOption.SUBSCRIBERS_COUNT}/`, method: HttpMethod.GET })
            .then((data) => {
                if (data && data.ok) {
                    setSubscribersCount(data.query)
                }
            })
    }, [])

    if (language === Language.EN) {
        return (
            <aside className="FriendsNavBar">
                <nav>
                    <p>
                        <Link to={`/friends/${user.username}/friends-section/`}>friends</Link>
                    </p>
                    <p>
                        <Link to={`/friends/${user.username}/subscribers-section/`}>
                            subscribers {subscribersCount !== 0 && <strong id="subscribersCount" >{subscribersCount}</strong>}
                        </Link>
                    </p>
                    <p>
                        <Link to={`/friends/${user.username}/subscriptions-section/`}>subscriptions</Link>
                    </p>
                </nav>
            </aside>
        )
    } else if (language === Language.RU) {
        return (
            <aside className="FriendsNavBar">
                <nav>
                    <p>
                        <Link to={`/friends/${user.username}/friends-section/`}>друзья</Link>
                    </p>
                    <p>
                        <Link to={`/friends/${user.username}/subscribers-section/`}>
                            подписчики {subscribersCount !== 0 && <strong id="subscribersCount" >{subscribersCount}</strong>}
                        </Link>
                    </p>
                    <p>
                        <Link to={`/friends/${user.username}/subscriptions-section/`}>подписки</Link>
                    </p>
                </nav>
            </aside>
        )
    }
}