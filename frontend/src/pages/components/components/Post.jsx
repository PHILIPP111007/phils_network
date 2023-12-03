import "./styles/Post.css"
import { useSignal } from "@preact/signals-react"
import { Link } from "react-router-dom"
import ReactLinkify from "react-linkify"
import settingsLogo from "@images/three_points.svg"
import Button from "@pages/components/UI/Button"

export default function Post({ post, ...props }) {

    const btnFlag = useSignal(true)

    function showButton() {
        if (post.postLen500) {
            if (btnFlag.value) {
                return (
                    <>
                        <Button onClick={() => btnFlag.value = false} >more</Button>
                        <br />
                        <br />
                    </>
                )
            } else {
                return (
                    <>
                        <Button onClick={() => btnFlag.value = true} >less</Button>
                        <br />
                        <br />
                    </>
                )
            }
        }
    }

    return (
        <div className="Post">
            <div className="title">
                {props.linkShow
                    ?
                    <Link className="link" to={`/user/${post.username}/`} >
                        <p>{post.first_name ? post.first_name : "No name"} {post.last_name ? post.last_name : "No name"} @{post.username}</p>
                        <p>{post.timestamp} {post.changed && "Modified"}</p>
                    </Link>
                    :
                    <p>{post.timestamp} {post.changed && "Modified"}</p>
                }
            </div>
            <br />
            <div className="content">
                <ReactLinkify>
                    {(post.postLen500 && btnFlag.value)
                        ?
                        post.content.substring(0, 499) + "..."
                        :
                        post.content
                    }
                </ReactLinkify>
            </div>
            <br />

            {showButton()}

            {props.settings === true
                &&
                <img
                    className="settingsLogo"
                    src={settingsLogo}
                    onClick={() => {
                        props.setMainSets({ ...props.mainSets, post: post })
                        props.setModalPost(true)
                    }}
                    alt="settings logo"
                />
            }
        </div>
    )
}