import { useMemo } from "react"
import Message from "./components/Message"

export default function Messages({ messages }) {

    var showMessages = useMemo(() => {
        return (
            messages.map((message) =>
                <Message key={message.id} message={message} />
            )
        )
    }, [messages.length])

    return (
        <div className="Messages">
            {showMessages}
        </div>
    )
}