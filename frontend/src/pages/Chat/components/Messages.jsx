import Message from "@pages/Chat/components/Message"
import { useMemo } from "react"

export default function Messages({ messages }) {

    const showMessages = useMemo(() => {
        return (
            messages.map((message) =>
                <Message key={message.id} message={message} />
            )
        )
    }, [messages])

    return (
        <div className="Messages">
            {showMessages}
        </div>
    )
}