import ReactLinkify from "react-linkify"
import { Link } from "react-router-dom"

export default function Message({ message }) {
    return (
        <div className="Message">
            <div className="info">
                <Link to={`/user/${message.sender}/`} >
                    <p>{message.first_name} {message.last_name} {message.timestamp}</p>
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