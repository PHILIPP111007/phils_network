import "./styles/Message.css"
import ReactLinkify from "react-linkify"
import { Link } from "react-router-dom"

export default function Message({ message }) {
    return (
        <div className="Message">
            <div className="info">
                <Link to={`/user/${message.username}/`} >
                    <p>{message.first_name} {message.last_name} <div className="timestamp">{message.timestamp}</div></p>
                </Link>
            </div>
            <div className="text">
                <ReactLinkify>
                    {message.text}
                </ReactLinkify>
            </div>
        </div>
    )
}