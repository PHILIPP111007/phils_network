import { useMemo } from "react"
import Message from "./components/Message"

export default function Messages({ messages, downloadFile }) {

    var showMessages = useMemo(() => {
        return (
            messages.map((message) =>
                <Message key={message.id} message={message} downloadFile={downloadFile} />
            )
        )
    }, [messages.length])

    return (
        <div className="Messages">
            {showMessages}
        </div>
    )
}