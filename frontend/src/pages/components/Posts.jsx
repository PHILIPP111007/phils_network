import { useMemo } from "react"
import Post from "@pages/components/Post"

export default function Posts({ posts, ...props }) {

    const showPosts = useMemo(() => {
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
    }, [posts])

    return (
        <div className="Posts">
            {showPosts}
        </div>
    )
}