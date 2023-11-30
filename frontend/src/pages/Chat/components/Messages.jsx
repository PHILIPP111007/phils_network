import Message from "./Message"

export default function Messages({ messages }) {
    return (
        <div className="Messages">
            {messages.map((message) =>
                <Message key={message.id} message={message} />
            )}
        </div>
    )
}
