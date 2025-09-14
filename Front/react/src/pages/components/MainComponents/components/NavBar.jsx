import "./styles/NavBar.css"
import { use } from "react"
import { Link } from "react-router-dom"
import { UserContext } from "../../../../data/context.js"
import { CacheKeys, Language } from "../../../../data/enums.js"

export default function NavBar() {

    var { user } = use(UserContext)
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    if (language === Language.EN) {
        return (
            <aside className="NavBar">
                <nav>
                    <p>
                        <Link to={`/users/${user.username}/`}>User</Link>
                    </p>
                    <p>
                        <Link to={`/chats/${user.username}/`}>Chats</Link>
                    </p>
                    <p>
                        <Link to={`/news/${user.username}/`}>News</Link>
                    </p>
                    <p>
                        <Link to={`/friends/${user.username}/`}>Friends</Link>
                    </p>
                    <p>
                        <Link to={`/w3/${user.username}/`}>W3</Link>
                    </p>
                </nav>
            </aside>
        )
    } else if (language === Language.RU) {
        return (
            <aside className="NavBar">
                <nav>
                    <p>
                        <Link to={`/users/${user.username}/`}>Пользователь</Link>
                    </p>
                    <p>
                        <Link to={`/chats/${user.username}/`}>Чаты</Link>
                    </p>
                    <p>
                        <Link to={`/news/${user.username}/`}>Новости</Link>
                    </p>
                    <p>
                        <Link to={`/friends/${user.username}/`}>Друзья</Link>
                    </p>
                    <p>
                        <Link to={`/w3/${user.username}/`}>W3</Link>
                    </p>
                </nav>
            </aside>
        )
    }
}