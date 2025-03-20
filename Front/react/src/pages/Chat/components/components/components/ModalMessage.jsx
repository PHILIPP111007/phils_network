import "./styles/ModalMessage.css"
import { use } from "react"
import { UserContext } from "../../../../../data/context"
import { CacheKeys, Language } from "../../../../../data/enums"
import Button from "../../../../components/UI/Button"


export default function ModalMessage({ message, deleteMessage }) {

    var { user } = use(UserContext)
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    function copyText() {
        navigator.clipboard.writeText(message.text)
    }

    if (language === Language.EN) {
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
    } else if (language === Language.RU) {
        return (
            <div className="ModalMessage">
                <Button onClick={() => copyText()}>Скопировать</Button>
                <br />
                <br />
                {(message.sender.username === user.username)
                    &&
                    <Button onClick={() => deleteMessage(message)}>Удалить</Button>
                }
            </div>
        )
    }
}