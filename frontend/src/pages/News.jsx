import "../styles/Posts.css"
import { useState, useContext } from "react"
import { useInView } from "react-intersection-observer"
import { UserContext } from "../data/context"
import useObserver from "../hooks/useObserver"
import Fetch from "../API/Fetch"
import MainComponents from "./components/MainComponents/MainComponents"
import Post from "./components/Post"
import Loading from "./components/Loading"
import LazyDiv from "./components/LazyDiv"

export default function News() {

    const { user } = useContext(UserContext)
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [ref, inView] = useInView()

    async function fetchAddPosts() {
        setLoading(true)
        await Fetch({ action: `api/news/${posts.length}/`, method: "GET" })
            .then((data) => {
                if (data) {
                    const newPosts = data.posts.map(post => {
                        return { ...post, postLen500: post.content.length > 500, btnFlag: true }
                    })
                    setPosts([...posts, ...newPosts])
                }
                setLoading(false)
            })
    }

    useObserver({ inView: inView, func: fetchAddPosts })

    return (
        <div className="News">
            <MainComponents user={user} />

            <div className="Posts">
                {posts.map((post) =>
                    <Post
                        key={post.id}
                        post={post}
                        posts={posts}
                        setPosts={setPosts}
                        linkShow={true}
                        settings={false}
                    />
                )}
                {loading && <Loading />}
            </div>

            <LazyDiv Ref={ref} />
        </div>
    )
}