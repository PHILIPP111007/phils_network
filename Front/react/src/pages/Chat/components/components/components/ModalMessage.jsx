import "./styles/ModalMessage.css"
import { use } from "react"
import { UserContext } from "../../../../../data/context"
import Button from "../../../../components/UI/Button"


export default function ModalMessage({ message, deleteMessage }) {

    var { user } = use(UserContext)

    function copyText() {
        navigator.clipboard.writeText(message.text)
    }

    return (
        <div className="ModalMessage">
            <Button onClick={() => copyText()}>Copy</Button>
            <br />
            <br />
            {(message.sender.username === user.username)
                &&
                <Button onClick={() => deleteMessage(message)}>Delete</Button>
            }
        </div>
    )
}