import "../styles/Posts.css"
import { useState } from "react"
import { useInView } from "react-intersection-observer"
import { useParams } from "react-router-dom"
import { HttpMethod } from "../data/enums.js"
import rememberPage from "../modules/rememberPage.js"
import useObserver from "../hooks/useObserver.js"
import Fetch from "../API/Fetch.js"
import MainComponents from "./components/MainComponents/MainComponents.jsx"
import Posts from "./components/Posts.jsx"
import LazyDiv from "./components/LazyDiv.jsx"
import ScrollToTopOrBottom from "./components/MainComponents/components/ScrollToTopOrBottom.jsx"

export default function News() {

    var params = useParams()
    rememberPage(`news/${params.username}`)

    var [posts, setPosts] = useState([])
    var [loading, setLoading] = useState(true)
    var [ref, inView] = useInView()

    async function fetchAddPosts() {
        setLoading(true)
        var data = await Fetch({ api_version: 2, action: `news/${posts.length}/`, method: HttpMethod.GET })
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