import "../styles/Posts.css"
import { useState, useContext, useMemo } from "react"
import { useInView } from "react-intersection-observer"
import { useParams } from "react-router-dom"
import { UserContext, AuthContext } from "@data/context"
import { HttpMethod } from "@data/enums"
import { useAuth, useSetUser } from "@hooks/useAuth"
import useObserver from "@hooks/useObserver"
import Fetch from "@API/Fetch"
import MainComponents from "@pages/components/MainComponents/MainComponents"
import Post from "@pages/components/Post"
import LazyDiv from "@pages/components/LazyDiv"
import ScrollToTopOrBottom from "@pages/components/MainComponents/components/ScrollToTopOrBottom"

export default function News() {

    localStorage.setItem("path", "/news/")

    const { setIsAuth } = useContext(AuthContext)
    const { user, setUser } = useContext(UserContext)
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [ref, inView] = useInView()
    const params = useParams()

    async function fetchAddPosts() {
        setLoading(true)
        const data = await Fetch({ action: `api/news/${posts.length}/`, method: HttpMethod.GET })
        if (data && data.ok) {
            const newPosts = data.posts.map(post => {
                return { ...post, postLen500: post.content.length > 500 }
            })
            setPosts([...posts, ...newPosts])
        }
        setLoading(false)
    }

    const showPosts = useMemo(() => {
        return posts.map((post) =>
            <Post
                key={post.id}
                post={post}
                linkShow={true}
                settings={false}
            />
        )
    }, [posts])

    useObserver({ inView: inView, func: fetchAddPosts })

    useAuth({ username: params.username, setIsAuth: setIsAuth })

    useSetUser({ username: params.username, setUser: setUser })

    return (
        <div className="News">
            <MainComponents user={user} loading={loading} />

            <ScrollToTopOrBottom bottom={false} />

            <div className="Posts">
                {showPosts}
            </div>

            <LazyDiv Ref={ref} />
        </div>
    )
}