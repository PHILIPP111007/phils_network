import '../styles/Posts.css'
import { useState, useContext } from "react"
import { useInView } from "react-intersection-observer"
import { useObserver } from "../hooks/useObserver"
import { UserContext } from "../data/context"
import { myFetch } from "../API/myFetch"
import MainComponents from "../components/MainComponents"
import Post from '../components/Post'
import Loading from "../components/Loading"
import LazyDiv from "../components/LazyDiv"

export default function News() {

    const { user } = useContext(UserContext)
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [ref, inView] = useInView()
    const token = localStorage.getItem('token')

    async function fetchAddPosts() {
        setLoading(true)
        await myFetch({ action: `api/news/${posts.length}/`, method: 'GET', token: token })
            .then((data) => {
                if (data.status) {
                    setPosts([...posts, ...data.posts])
                }
                setLoading(false)
            })
    }

    useObserver({inView: inView, func: fetchAddPosts})

    return (
        <div className="News">

            <MainComponents user={user} />

            <div className='Posts'>
                {posts.map((post) =>
                    <Post key={post.id} post={post} linkShow={true} settings={false} />
                )}
                {loading && <Loading />}
            </div>

            <LazyDiv myRef={ref} />

        </div>
    )
}