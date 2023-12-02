import Message from "@pages/Chat/components/Message"

export default function Messages({ messages }) {
    return (
        <div className="Messages">
            {messages.map((message) =>
                <Message key={message.id} message={message} />
            )}
        </div>
    )
}
