import "../styles/Posts.css"
import { useState, useContext } from "react"
import { useInView } from "react-intersection-observer"
import { useParams } from "react-router-dom"
import { UserContext, AuthContext } from "@data/context"
import { HttpMethod } from "@data/enums"
import { useAuth, useSetUser } from "@hooks/useAuth"
import rememberPage from "@modules/rememberPage"
import useObserver from "@hooks/useObserver"
import Fetch from "@API/Fetch"
import MainComponents from "@pages/components/MainComponents/MainComponents"
import Posts from "./components/Posts"
import LazyDiv from "@pages/components/LazyDiv"
import ScrollToTopOrBottom from "@pages/components/MainComponents/components/ScrollToTopOrBottom"

export default function News() {

    rememberPage("/news/")

    var { setIsAuth } = useContext(AuthContext)
    var { user, setUser } = useContext(UserContext)
    var [posts, setPosts] = useState([])
    var [loading, setLoading] = useState(true)
    var [ref, inView] = useInView()
    var params = useParams()

    async function fetchAddPosts() {
        setLoading(true)
        var data = await Fetch({ action: `api/news/${posts.length}/`, method: HttpMethod.GET })
        if (data && data.ok) {
            var newPosts = data.posts.map(post => {
                return { ...post, postLen500: post.content.length > 500 }
            })
            setPosts([...posts, ...newPosts])
        }
        setLoading(false)
    }

    useObserver({ inView: inView, func: fetchAddPosts })

    useAuth({ username: params.username, setIsAuth: setIsAuth })

    useSetUser({ username: params.username, setUser: setUser })

    return (
        <div className="News">
            <MainComponents user={user} loading={loading} />

            <ScrollToTopOrBottom bottom={false} />

            <Posts
                posts={posts}
                linkShow={true}
                settings={false}
            />

            <LazyDiv Ref={ref} />
        </div>
    )
}