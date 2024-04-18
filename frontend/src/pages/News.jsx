import "../styles/Posts.css"
import { useState } from "react"
import { useInView } from "react-intersection-observer"
import { HttpMethod } from "@data/enums"
import rememberPage from "@modules/rememberPage"
import useObserver from "@hooks/useObserver"
import Fetch from "@API/Fetch"
import MainComponents from "@pages/components/MainComponents/MainComponents"
import Posts from "./components/Posts"
import LazyDiv from "@pages/components/LazyDiv"
import ScrollToTopOrBottom from "@pages/components/MainComponents/components/ScrollToTopOrBottom"

export default function News() {

    rememberPage("news")

    var [posts, setPosts] = useState([])
    var [loading, setLoading] = useState(true)
    var [ref, inView] = useInView()

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

    return (
        <div className="News">
            <MainComponents loading={loading} />

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