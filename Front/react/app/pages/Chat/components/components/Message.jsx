import "./styles/Message.css"
import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import { getFileUrl } from "../../../../modules/getFileUrl.js"
import { CacheKeys, Language } from "../../../../data/enums.js"
import ModalMessage from "./components/ModalMessage.jsx"
import Modal from "../../../components/Modal.jsx"
import Button from "../../../components/UI/Button.jsx"
import fileIcon from "../../../../images/file-icon.svg"

export default function Message({ message, downloadFile, deleteMessage, setParentId, likeMessage, unLikeMessage }) {

    var [modalMessage, setModalMessage] = useState(false)
    var [imageUrl, setImageUrl] = useState(null)
    var [parentImageUrl, setParentImageUrl] = useState(null)
    var [userImageUrl, setUserImageUrl] = useState(null)
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

    useEffect(() => {
        var url

        if (message.file.path) {
            url = getFileUrl(message.file.content)
            setImageUrl(url)
        }

        if (message.parent && message.parent.file && message.parent.file.path) {
            url = getFileUrl(message.parent.file.content)
            setParentImageUrl(url)
        }

        if (message.sender.image) {
            url = getFileUrl(message.sender.image)
            setUserImageUrl(url)
        }
    }, [])

    var showLikes = useMemo(() => {
        if (message.likes > 0) {
            return (
                <div className="Likes">&#10084; {message.likes}</div>
            )
        }
    }, [message.likes])

    if (message.file.path) {

        if (language === Language.EN) {
            return (
                <div id={`Message_${message.id}`} className="Message"
                    onContextMenu={() => {
                        setModalMessage(true)
                    }}>
                    <Modal modal={modalMessage} setModal={setModalMessage}>
                        <ModalMessage message={message} deleteMessage={deleteMessage} setParentId={setParentId} setModalMessage={setModalMessage} likeMessage={likeMessage} unLikeMessage={unLikeMessage} />
                    </Modal>
                    <div className="info">
                        {userImageUrl &&
                            <img
                                className="MessageUserImage"
                                src={userImageUrl}
                                alt="user image"
                            />
                        }
                        <Link to={`/users/${message.sender.username}/`} >
                            <p className="timestamp">{message.parent && "Reply"} {message.sender.first_name} {message.sender.last_name} @{message.sender.username} {message.timestamp} {message.sender.is_online && <div className="MessageOnlineStatus"></div>}</p>
                        </Link>
                    </div>
                    {imageUrl &&
                        <>
                            <div style={{ marginBottom: "20px" }}>
                                <img
                                    className="MessageImage"
                                    src={imageUrl}
                                    alt="Uploaded preview"
                                />
                            </div>
                        </>
                    }

                    <div className="text">
                        <ReactMarkdown children={message.text} />
                    </div>
                    <img src={fileIcon} alt="file icon" width={50} />
                    <div className="downloadButton">
                        <Button onClick={() => downloadFile(message)}>Download file</Button>
                    </div>
                    <div className="file">
                        {trimFileName(message.file.path)}
                    </div>
                    <div className="info">
                        {
                            message.parent &&
                            <>
                                <hr />
                                {parentImageUrl &&
                                    <>
                                        <div style={{ marginBottom: "20px" }}>
                                            <img
                                                className="MessageImage"
                                                src={parentImageUrl}
                                                alt="Uploaded preview"
                                            />
                                        </div>
                                    </>
                                }
                                <Link to={`/users/${message.parent.sender.username}/`} >
                                    <p className="timestamp">{message.parent.sender.first_name} {message.parent.sender.last_name} @{message.parent.sender.username} {message.parent.timestamp} {message.parent.sender.is_online && <div className="MessageOnlineStatus"></div>}</p>
                                </Link>
                                <div className="text">
                                    <ReactMarkdown children={message.parent.text} />
                                </div>
                            </>
                        }
                    </div>
                    {showLikes}
                </div>
            )
        } else if (language === Language.RU) {
            return (
                <div id={`Message_${message.id}`} className="Message"
                    onContextMenu={() => {
                        setModalMessage(true)
                    }}>
                    <Modal modal={modalMessage} setModal={setModalMessage}>
                        <ModalMessage message={message} deleteMessage={deleteMessage} setParentId={setParentId} setModalMessage={setModalMessage} likeMessage={likeMessage} unLikeMessage={unLikeMessage} />
                    </Modal>
                    <div className="info">
                        {userImageUrl &&
                            <img
                                className="MessageUserImage"
                                src={userImageUrl}
                                alt="user image"
                            />
                        }
                        <Link to={`/users/${message.sender.username}/`} >
                            <p className="timestamp">{message.parent && "Ответ"} {message.sender.first_name} {message.sender.last_name} @{message.sender.username} {message.timestamp} {message.sender.is_online && <div className="MessageOnlineStatus"></div>}</p>
                        </Link>
                    </div>
                    {imageUrl &&
                        <>
                            <div style={{ marginBottom: "20px" }}>
                                <img
                                    className="MessageImage"
                                    src={imageUrl}
                                    alt="Uploaded preview"
                                />
                            </div>
                        </>
                    }

                    <div className="text">
                        <ReactMarkdown children={message.text} />
                    </div>
                    <img src={fileIcon} alt="file icon" width={50} />
                    <div className="downloadButton">
                        <Button onClick={() => downloadFile(message)}>Скачать файл</Button>
                    </div>
                    <div className="file">
                        {trimFileName(message.file.path)}
                    </div>
                    <div className="info">
                        {
                            message.parent &&
                            <>
                                <hr />
                                {parentImageUrl &&
                                    <>
                                        <div style={{ marginBottom: "20px" }}>
                                            <img
                                                className="MessageImage"
                                                src={parentImageUrl}
                                                alt="Uploaded preview"
                                            />
                                        </div>
                                    </>
                                }
                                <Link to={`/users/${message.parent.sender.username}/`} >
                                    <p className="timestamp">{message.parent.sender.first_name} {message.parent.sender.last_name} @{message.parent.sender.username} {message.parent.timestamp} {message.parent.sender.is_online && <div className="MessageOnlineStatus"></div>}</p>
                                </Link>
                                <div className="text">
                                    <ReactMarkdown children={message.parent.text} />
                                </div>
                            </>
                        }
                    </div>
                    {showLikes}
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
                <ModalMessage message={message} deleteMessage={deleteMessage} setParentId={setParentId} setModalMessage={setModalMessage} likeMessage={likeMessage} unLikeMessage={unLikeMessage} />
            </Modal>
            <div className="info">
                {userImageUrl &&
                    <img
                        className="MessageUserImage"
                        src={userImageUrl}
                        alt="user image"
                    />
                }
                <Link to={`/users/${message.sender.username}/`} >
                    <p className="timestamp">{message.parent && "Reply"} {message.sender.first_name} {message.sender.last_name} @{message.sender.username} {message.timestamp} {message.sender.is_online && <div className="MessageOnlineStatus"></div>}</p>
                </Link>
            </div>
            <div className="text">
                <ReactMarkdown children={message.text} />
            </div>
            <div className="info">
                {
                    message.parent &&
                    <>
                        <hr />
                        {parentImageUrl &&
                            <>
                                <div style={{ marginBottom: "20px" }}>
                                    <img
                                        className="MessageImage"
                                        src={parentImageUrl}
                                        alt="Uploaded preview"
                                    />
                                </div>
                            </>
                        }
                        <Link to={`/users/${message.parent.sender.username}/`} >
                            <p className="timestamp">{message.parent.sender.first_name} {message.parent.sender.last_name} @{message.parent.sender.username} {message.parent.timestamp} {message.parent.sender.is_online && <div className="MessageOnlineStatus"></div>}</p>
                        </Link>
                        <div className="text">
                            <ReactMarkdown children={message.parent.text} />
                        </div>
                    </>
                }
            </div>
            {showLikes}
        </div>
    )
}