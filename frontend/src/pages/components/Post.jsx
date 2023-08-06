import "./styles/Post.css"
import { Link } from "react-router-dom"
import ReactLinkify from "react-linkify"
import settingsLogo from "../../images/three_points.svg"
import Button from "./UI/Button"

export default function Post({ post, ...props }) {

    function setFlag(bool) {
        props.setPosts(
            [
                ...props.posts.map((p) => {
                    if (p.id === post.id) { return { ...p, btnFlag: bool } }
                    return p
                })
            ]
        )
    }

    function showButton() {
        if (post.postLen500) {
            if (post.btnFlag) {
                return (
                    <div>
                        <Button onClick={() => setFlag(false)} >read more</Button>
                        <br />
                        <br />
                    </div>
                )
            } else {
                return (
                    <div>
                        <Button onClick={() => setFlag(true)} >read less</Button>
                        <br />
                        <br />
                    </div>
                )
            }
        }
    }

    return (
        <div className="Post">
            <div className="title">
                {props.linkShow
                    ?
                    <div className="link">
                        <Link to={`/user/${post.username}/`} >
                            <p>{post.first_name ? post.first_name : "No name"} {post.last_name ? post.last_name : "No name"} @{post.username}</p>
                            <p>{post.timestamp} {post.changed && "Modified"}</p>
                        </Link>
                    </div>
                    :
                    <p>{post.timestamp} {post.changed && "Modified"}</p>
                }
            </div>
            <br />
            <div className="content">
                <p>
                    <ReactLinkify>
                        {(post.postLen500 && post.btnFlag)
                            ?
                            post.content.substring(0, 499) + "..."
                            :
                            post.content
                        }
                    </ReactLinkify>
                </p>
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