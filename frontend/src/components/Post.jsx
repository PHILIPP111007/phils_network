import '../styles/Post.css'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import settingsLogo from '../images/three_points.svg'
import Button from "./UI/Button"

export default function Post(props) {

    const [flag, setFlag] = useState(props.post.content.length > 500)

    return (
        <div className='Post'>
            <div className='title'>
                {props.post.username
                    ?
                    <div className='link' >
                        <Link to={`/user/${props.post.username}/`} >
                            <p>{props.post.first_name} {props.post.last_name}</p>
                            <p>{props.post.date_time} {props.post.is_changed && 'Modified'}</p>
                        </Link>
                    </div>
                    :
                    <p>{props.post.date_time} {props.post.is_changed && 'Modified'}</p>
                }
            </div>
            <br />
            <div className='content'>
                <p>
                    {(props.post.content.length > 500 && flag)
                        ?
                        props.post.content.substring(0, 499) + '...'
                        :
                        props.post.content
                    }
                </p>
            </div>
            <br />
            {(props.post.content.length > 500 && flag)
                &&
                <div>
                    <Button onClick={() => setFlag(false)} >read more</Button>
                    <br />
                    <br />
                </div>
            }

            {(props.post.content.length > 500 && !flag)
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
                        props.setPost(props.post)
                        props.setModalPost(true)
                    }}
                />
            }
        </div>
    )
}