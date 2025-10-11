import "./styles/UserInput.css"
import { useState, use, useEffect } from "react"
import { Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import { UserContext } from "../../../data/context.js"
import { CacheKeys, Language } from "../../../data/enums.js"
import Modal from "../../components/Modal.jsx"
import ModalRoomEdit from "../../Chat/components/components/ModalRoomEdit.jsx"
import Input from "../../components/UI/Input.jsx"
import settingsLogo from "../../../images/three_points_gray.svg"
import sendIcon from "../../../images/send-icon.svg"

export default function UserInput({ mainSets, sendMessage, editRoom, parentMessage }) {

    var { user } = use(UserContext)
    var [modalRoomEdit, setModalRoomEdit] = useState(false)
    var [text, setText] = useState("")
    var [selectedFile, setSelectedFile] = useState(null)
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

                {
                    parentMessage &&
                    <>
                        <div className="ParentMessage">
                            <div className="info">
                                <Link to={`/users/${parentMessage.sender.username}/`} >
                                    <p className="timestamp">{parentMessage.sender.first_name} {parentMessage.sender.last_name} @{parentMessage.sender.username} {parentMessage.timestamp} {parentMessage.sender.is_online && <div className="MessageOnlineStatus"></div>}</p>
                                </Link>
                            </div>
                            <div className="text">
                                <ReactMarkdown children={parentMessage.text} />
                            </div>
                        </div>
                        <br />
                    </>
                }
                <div className="UserInput">
                    <form onChange={e => setSelectedFile(e.target.files[0])} className="uploadFileForm">
                        <Input id="formFile" type="file" />
                    </form>
                    <div className="ButtonsAndTextArea">
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
                            sendMessage(text, selectedFile)
                            setText("")
                            setSelectedFile(null)
                        }}
                            alt="send button"
                        />
                    </div>
                </div>
            </>
        )
    } else if (language === Language.RU) {
        return (
            <>
                <Modal modal={modalRoomEdit} setModal={setModalRoomEdit}>
                    <ModalRoomEdit mainSets={mainSets} me={user} editRoom={editRoom} />
                </Modal>

                {
                    parentMessage &&
                    <>
                        <div className="ParentMessage">
                            <div className="info">
                                <Link to={`/users/${parentMessage.sender.username}/`} >
                                    <p className="timestamp">{parentMessage.sender.first_name} {parentMessage.sender.last_name} @{parentMessage.sender.username} {parentMessage.timestamp} {parentMessage.sender.is_online && <div className="MessageOnlineStatus"></div>}</p>
                                </Link>
                            </div>
                            <div className="text">
                                <ReactMarkdown children={parentMessage.text} />
                            </div>
                        </div>
                        <br />
                    </>
                }
                <div className="UserInput">
                    <form onChange={e => setSelectedFile(e.target.files[0])} className="uploadFileForm">
                        <Input id="formFile" type="file" />
                    </form>
                    <div className="ButtonsAndTextArea">
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
                            sendMessage(text, selectedFile)
                            setText("")
                        }}
                            alt="кнопка отправки"
                        />
                    </div>
                </div>
            </>
        )
    }
}