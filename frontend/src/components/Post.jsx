import '../styles/Post.css'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import ReactLinkify from 'react-linkify'
import settingsLogo from '../images/three_points.svg'
import Button from "./UI/Button"

export default function Post({ post, ...props }) {

    const [flag, setFlag] = useState(post.content.length > 500)

    return (
        <div className='Post'>
            <div className='title'>
                {props.linkShow
                    ?
                    <div className='link'>
                        <Link to={`/user/${post.username}/`} >
                            <p>{post.first_name} {post.last_name}</p>
                            <p>{post.timestamp} {post.changed && 'Modified'}</p>
                        </Link>
                    </div>
                    :
                    <p>{post.timestamp} {post.changed && 'Modified'}</p>
                }
            </div>
            <br />
            <div className='content'>
                <p>
                    <ReactLinkify>
                        {(post.content.length > 500 && flag)
                            ?
                            post.content.substring(0, 499) + '...'
                            :
                            post.content
                        }
                    </ReactLinkify>
                </p>
            </div>
            <br />
            {(post.content.length > 500 && flag)
                &&
                <div>
                    <Button onClick={() => setFlag(false)} >read more</Button>
                    <br />
                    <br />
                </div>
            }

            {(post.content.length > 500 && !flag)
                &&
                <div>
                    <Button onClick={() => setFlag(true)} >read less</Button>
                    <br />
                    <br />
                </div>
            }

            {props.settings === true
                &&
                <img
                    className='settingsLogo'
                    src={settingsLogo}
                    onClick={() => {
                        props.setPost(post)
                        props.setModalPost(true)
                    }}
                    alt='settings logo'
                />
            }
        </div>
    )
}