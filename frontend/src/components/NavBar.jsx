import "../styles/NavBar.css"
import { useContext } from "react"
import { Link } from "react-router-dom"
import { UserContext } from "../data/context"

export default function NavBar() {

    const { user } = useContext(UserContext)

    return (
        <aside className="NavBar">
            <nav>
                <p>
                    <Link to={`/user/${user.username}/`}>User</Link>
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
            </nav>
        </aside>
    )
}