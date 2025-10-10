import { useMemo } from "react"
import Message from "./components/Message.jsx"

export default function Messages({ messages, downloadFile, deleteMessage, setParentId, likeMessage, unLikeMessage }) {

    var showMessages = useMemo(() => {
        return (
            messages.map((message) =>
                <Message
                    key={message.id}
                    message={message}
                    downloadFile={downloadFile}
                    deleteMessage={deleteMessage}
                    setParentId={setParentId}
                    likeMessage={likeMessage}
                    unLikeMessage={unLikeMessage}
                />
            )
        )
    }, [messages.length])

    return (
        <div className="Messages">
            {showMessages}
        </div>
    )
}