import "./styles/Message.css"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import { CacheKeys, Language } from "../../../../data/enums.js"
import ModalMessage from "./components/ModalMessage.jsx"
import Modal from "../../../components/Modal.jsx"
import Button from "../../../components/UI/Button.jsx"
import fileIcon from "../../../../images/file-icon.svg"

export default function Message({ message, downloadFile, deleteMessage }) {

    var [modalMessage, setModalMessage] = useState(false)
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    function trimFileName(file) {
        var file_split = file.split("/")
        var file_name_length = file_split.length
        return file_split[file_name_length - 1]
    }

    useEffect(() => {
        var touchArea = document.getElementById(`Message_${message.id}`)
        let longPressTimeout
        var LONG_PRESS_DURATION = 500 // duration in milliseconds

        touchArea.addEventListener("touchstart", (event) => {
            longPressTimeout = setTimeout(() => {
                setModalMessage(true)
            }, LONG_PRESS_DURATION)
        })

        touchArea.addEventListener("touchend", () => {
            clearTimeout(longPressTimeout)
        })

        touchArea.addEventListener("touchcancel", () => {
            clearTimeout(longPressTimeout)
        })
    }, [])

    if (message.file) {

        if (language === Language.EN) {
            return (
                <div id={`Message_${message.id}`} className="Message"
                    onContextMenu={() => {
                        setModalMessage(true)
                    }}>
                    <Modal modal={modalMessage} setModal={setModalMessage}>
                        <ModalMessage message={message} deleteMessage={deleteMessage} />
                    </Modal>
                    <div className="info">
                        <Link to={`/users/${message.sender.username}/`} >
                            <p className="timestamp">{message.sender.first_name} {message.sender.last_name} @{message.sender.username} {message.timestamp} {message.sender.is_online && <div className="MessageOnlineStatus"></div>}</p>
                        </Link>
                    </div>
                    <div className="text">
                        <ReactMarkdown children={message.text} />
                    </div>
                    <img src={fileIcon} alt="file icon" width={50} />
                    <div className="downloadButton">
                        <Button onClick={() => downloadFile(message)}>Download file</Button>
                    </div>
                    <div className="file">
                        {trimFileName(message.file)}
                    </div>
                </div>
            )
        } else if (language === Language.RU) {
            return (
                <div id={`Message_${message.id}`} className="Message"
                    onContextMenu={() => {
                        setModalMessage(true)
                    }}>
                    <Modal modal={modalMessage} setModal={setModalMessage}>
                        <ModalMessage message={message} deleteMessage={deleteMessage} />
                    </Modal>
                    <div className="info">
                        <Link to={`/users/${message.sender.username}/`} >
                            <p className="timestamp">{message.sender.first_name} {message.sender.last_name} @{message.sender.username} {message.timestamp} {message.sender.is_online && <div className="MessageOnlineStatus"></div>}</p>
                        </Link>
                    </div>
                    <div className="text">
                        <ReactMarkdown children={message.text} />
                    </div>
                    <img src={fileIcon} alt="file icon" width={50} />
                    <div className="downloadButton">
                        <Button onClick={() => downloadFile(message)}>Скачать файл</Button>
                    </div>
                    <div className="file">
                        {trimFileName(message.file)}
                    </div>
                </div>
            )
        }
    }
    return (
        <div id={`Message_${message.id}`} className="Message"
            onContextMenu={() => {
                setModalMessage(true)
            }}>
            <Modal modal={modalMessage} setModal={setModalMessage}>
                <ModalMessage message={message} deleteMessage={deleteMessage} />
            </Modal>
            <div className="info">
                <Link to={`/users/${message.sender.username}/`} >
                    <p className="timestamp">{message.sender.first_name} {message.sender.last_name} @{message.sender.username} {message.timestamp} {message.sender.is_online && <div className="MessageOnlineStatus"></div>}</p>
                </Link>
            </div>
            <div className="text">
                <ReactMarkdown children={message.text} />
            </div>
        </div>
    )
}