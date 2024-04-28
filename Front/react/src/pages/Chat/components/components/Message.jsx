import "./styles/Message.css"
import ReactLinkify from "react-linkify"
import { Link } from "react-router-dom"

export default function Message({ message }) {
    return (
        <div className="Message">
            <div className="info">
                <Link to={`/user/${message.sender.username}/`} >
                    <p className="timestamp">{message.sender.first_name} {message.sender.last_name} @{message.sender.username} {message.timestamp}</p>
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