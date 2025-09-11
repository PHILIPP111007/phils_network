import "./styles/UserInput.css"
import { useState, use, useEffect } from "react"
import { UserContext } from "../../../data/context.js"
import { CacheKeys, Language } from "../../../data/enums.js"
import Modal from "../../components/Modal.jsx"
import ModalRoomEdit from "../../Chat/components/components/ModalRoomEdit.jsx"
import Input from "../../components/UI/Input.jsx"
import settingsLogo from "../../../images/three_points_gray.svg"
import sendIcon from "../../../images/send-icon.svg"

export default function UserInput({ mainSets, sendMessage, editRoom, sendFileMessage }) {

    var { user } = use(UserContext)
    var [modalRoomEdit, setModalRoomEdit] = useState(false)
    var [text, setText] = useState("")
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    function hideUserInput() {
        var user_input = document.getElementsByClassName("UserInput")[0]
        user_input.style.display = "none"
    }

    useEffect(() => {
        if (modalRoomEdit === false) {
            var user_input = document.getElementsByClassName("UserInput")[0]
            user_input.style.display = ""
        }
    }, [modalRoomEdit])

    if (language === Language.EN) {
        return (
            <>
                <Modal modal={modalRoomEdit} setModal={setModalRoomEdit}>
                    <ModalRoomEdit mainSets={mainSets} me={user} editRoom={editRoom} />
                </Modal>

                <div className="UserInput">
                    <form onSubmit={e => sendFileMessage(e)} className="uploadFileForm">
                        <Input id="uploadFileInput" type="file" />
                        <Input type="submit" value="Send file" />
                    </form>
                    <img
                        id="SettingsButton"
                        src={settingsLogo}
                        onClick={() => {
                            hideUserInput()
                            setModalRoomEdit(true)
                        }}
                        alt="settings button"
                    />
                    <textarea
                        className="TextArea"
                        placeholder="Use markdown to format your text..."
                        value={text}
                        maxLength="5000"
                        onChange={(e) => setText(e.target.value)}
                    />
                    <img id="SendButton" src={sendIcon} onClick={() => {
                        sendMessage(text)
                        setText("")
                    }} alt="send button" />
                </div>
            </>
        )
    } else if (language === Language.RU) {
        return (
            <>
                <Modal modal={modalRoomEdit} setModal={setModalRoomEdit}>
                    <ModalRoomEdit mainSets={mainSets} me={user} editRoom={editRoom} />
                </Modal>

                <div className="UserInput">
                    <form onSubmit={e => sendFileMessage(e)} className="uploadFileForm">
                        <Input id="uploadFileInput" type="file" />
                        <Input type="submit" value="Отправить файл" />
                    </form>
                    <img
                        id="SettingsButton"
                        src={settingsLogo}
                        onClick={() => {
                            hideUserInput()
                            setModalRoomEdit(true)
                        }}
                        alt="кнопка настроек"
                    />
                    <textarea
                        className="TextArea"
                        placeholder="Используйте Markdown для форматирования текста..."
                        value={text}
                        maxLength="5000"
                        onChange={(e) => setText(e.target.value)}
                    />
                    <img id="SendButton" src={sendIcon} onClick={() => {
                        sendMessage(text)
                        setText("")
                    }} alt="кнопка отправки" />
                </div>
            </>
        )
    }
}