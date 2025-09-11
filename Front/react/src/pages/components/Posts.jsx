import { useMemo } from "react"
import Post from "./components/Post.jsx"

export default function Posts({ posts, ...props }) {

    var showPosts = useMemo(() => {
        return posts.map((post) =>
            <Post
                key={post.id}
                post={post}
                linkShow={props.linkShow}
                settings={props.settings}
                mainSets={props.mainSets}
                setMainSets={props.setMainSets}
                setModalPost={props.setModalPost}
            />
        )
    }, [posts, props.settings])

    return (
        <div className="Posts">
            {showPosts}
        </div>
    )
}