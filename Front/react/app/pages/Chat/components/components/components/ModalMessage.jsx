import "./styles/ModalMessage.css"
import { use } from "react"
import { UserContext } from "../../../../../data/context.js"
import { CacheKeys, Language } from "../../../../../data/enums.js"
import Button from "../../../../components/UI/Button.jsx"


export default function ModalMessage({ message, deleteMessage, setParentId, setModalMessage, likeMessage, unLikeMessage }) {

    var { user } = use(UserContext)
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    function copyText() {
        navigator.clipboard.writeText(message.text)
    }

    if (language === Language.EN) {
        return (
            <div className="ModalMessage">
                <Button onClick={() => {
                    copyText()
                    setModalMessage(false)
                }}>Copy</Button>
                <br />
                <br />
                <Button onClick={() => {
                    setParentId(message.id)
                    setModalMessage(false)
                }}>Reply</Button>
                <br />
                <br />
                <Button onClick={() => {
                    likeMessage(message.id)
                    setModalMessage(false)
                }}>&#10084; Like</Button>
                <br />
                <br />
                <Button onClick={() => {
                    unLikeMessage(message.id)
                    setModalMessage(false)
                }}>&#128078; Unlike</Button>
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
                <Button onClick={() => {
                    copyText()
                    setModalMessage(false)
                }}>Скопировать</Button>
                <br />
                <br />
                <Button onClick={() => {
                    setParentId(message.id)
                    setModalMessage(false)
                }}>Ответить</Button>
                <br />
                <br />
                <Button onClick={() => {
                    likeMessage(message.id)
                    setModalMessage(false)
                }}>&#10084; Лайк</Button>
                <br />
                <br />
                <Button onClick={() => {
                    unLikeMessage(message.id)
                    setModalMessage(false)
                }}>&#128078; Не нравится</Button>
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