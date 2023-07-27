import '../styles/FriendsNavBar.css'
import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserContext } from '../data/context'
import { myFetch } from '../API/myFetch'

export default function FriendsNavBar() {

    const { user } = useContext(UserContext)
    const [subscribersCount, setSubscribersCount] = useState(0)
    const token = localStorage.getItem('token')

    useEffect(() => {
        myFetch({ action: `api/friends/subscribers_count/`, method: 'GET', token: token })
            .then((data) => {
                if (data.status) {
                    setSubscribersCount(data.query)
                }
            })
    }, [])

    return (
        <aside className='FriendsNavBar'>
            <nav>
                <p>
                    <Link to={`/friends/${user.username}/friends-section/`}>friends</Link>
                </p>
                <p>
                    <Link to={`/friends/${user.username}/subscribers-section/`}>
                        subscribers {subscribersCount !== 0 && <strong className='subscribersCount' >{subscribersCount}</strong>}
                    </Link>
                </p>
                <p>
                    <Link to={`/friends/${user.username}/subscriptions-section/`}>subscriptions</Link>
                </p>
            </nav>
        </aside>
    )
}