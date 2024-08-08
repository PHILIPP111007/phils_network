import "./styles/Post.css"
import { useState } from "react"
import { Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import settingsLogo from "@images/three_points.svg"
import Button from "@pages/components/UI/Button"

export default function Post({ post, ...props }) {

    var [btnFlag, setBtnFlag] = useState(true)

    function showButton() {
        if (post.postLen500) {
            if (btnFlag) {
                return (
                    <>
                        <Button onClick={() => setBtnFlag(false)} >more</Button>
                        <br />
                        <br />
                    </>
                )
            } else {
                return (
                    <>
                        <Button onClick={() => setBtnFlag(true)} >less</Button>
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
                    <Link className="link" to={`/users/${post.username}/`} >
                        <p>{post.first_name ? post.first_name : "No name"} {post.last_name ? post.last_name : "No name"} @{post.username}</p>
                        <p>{post.timestamp} {post.changed && "Modified"}</p>
                    </Link>
                    :
                    <p>{post.timestamp} {post.changed && "Modified"}</p>
                }
            </div>
            <br />
            <div className="content">
                <ReactMarkdown children={
                    (post.postLen500 && btnFlag)
                        ?
                        post.content.substring(0, 499) + "..."
                        :
                        post.content
                    
                } />
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