import "./styles/Post.css"
import { useState } from "react"
import { Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import { CacheKeys, Language } from "../../../data/enums"
import settingsLogo from "../../../images/three_points.svg"
import Button from "../UI/Button"

export default function Post({ post, ...props }) {

    var [btnFlag, setBtnFlag] = useState(true)
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    function showButton() {
        if (post.postLen500) {
            if (btnFlag) {
                if (language === Language.EN) {
                    return (
                        <>
                            <Button onClick={() => setBtnFlag(false)} >more</Button>
                            <br />
                            <br />
                        </>
                    )
                } else if (language === Language.RU) {
                    return (
                        <>
                            <Button onClick={() => setBtnFlag(false)} >больше</Button>
                            <br />
                            <br />
                        </>
                    )
                }
            } else {
                if (language === Language.EN) {
                    return (
                        <>
                            <Button onClick={() => setBtnFlag(true)} >less</Button>
                            <br />
                            <br />
                        </>
                    )
                } else if (language === Language.RU) {
                    return (
                        <>
                            <Button onClick={() => setBtnFlag(true)} >меньше</Button>
                            <br />
                            <br />
                        </>
                    )
                }
            }
        }
    }

    if (language === Language.EN) {
        return (
            <div className="Post">
                <div className="title">
                    {props.linkShow
                        ?
                        <Link className="link" to={`/users/${post.user.username}/`} >
                            <p>{post.user.first_name ? post.user.first_name : "No name"} {post.user.last_name ? post.user.last_name : "No name"} @{post.user.username}</p>
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
    } else if (language === Language.RU) {
        return (
            <div className="Post">
                <div className="title">
                    {props.linkShow
                        ?
                        <Link className="link" to={`/users/${post.user.username}/`} >
                            <p>{post.user.first_name ? post.user.first_name : "Нет имени"} {post.user.last_name ? post.user.last_name : "Нет имени"} @{post.user.username}</p>
                            <p>{post.timestamp} {post.changed && "Измененный"}</p>
                        </Link>
                        :
                        <p>{post.timestamp} {post.changed && "Измененный"}</p>
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
                        alt="логотип настроек"
                    />
                }
            </div>
        )
    }
}