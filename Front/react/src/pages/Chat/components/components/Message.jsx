import "./styles/Message.css"
import ReactMarkdown from "react-markdown"
import { Link } from "react-router-dom"
import Button from "../../../components/UI/Button"

export default function Message({ message, downloadFile }) {

    function trimFileName(file) {
        var file_split = file.split('/')
        var file_name_length = file_split.length
        return file_split[file_name_length - 1]
    }

    if (message.file) {
        return (
            <div className="Message">
                <div className="info">
                    <Link to={`/users/${message.sender.username}/`} >
                        <p className="timestamp">{message.sender.first_name} {message.sender.last_name} @{message.sender.username} {message.timestamp}</p>
                    </Link>
                </div>
                <div className="downloadButton">
                    <Button onClick={() => downloadFile(message)}>Download file</Button>
                </div>
                <div className="file">
                    {trimFileName(message.file)}
                </div>
            </div>
        )
    }
    return (
        <div className="Message">
            <div className="info">
                <Link to={`/users/${message.sender.username}/`} >
                    <p className="timestamp">{message.sender.first_name} {message.sender.last_name} @{message.sender.username} {message.timestamp}</p>
                </Link>
            </div>
            <div className="text">
                <ReactMarkdown children={message.text} />
            </div>
        </div>
    )
}