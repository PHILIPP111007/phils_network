import "../styles/Chat.css"
import { useContext, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useInView } from "react-intersection-observer"
import { UserContext } from "../data/context"
import { myFetch } from "../API/myFetch"
import { useObserver } from "../hooks/useObserver"
import MainComponents from "../components/MainComponents"
import Modal from "../components/Modal"
import ModalRoomEdit from "../components/modals/ModalRoomEdit"
import Message from "../components/Message"
import LazyDiv from "../components/LazyDiv"
import Loading from "../components/Loading"
import sendIcon from "../images/send-icon.svg"
import settingsLogo from "../images/three_points_gray.svg"

export default function Chat() {

    const { user } = useContext(UserContext)
    const [isCreator, setIsCreator] = useState(false)
    const [room, setRoom] = useState({ id: undefined, name: "", subscribers_info: [] })
    const [messages, setMessages] = useState([])
    const [text, setText] = useState("")
    const [invitationChanges, setInvitationChanges] = useState({ friends: [], subscribers: [] })
    const [loading, setLoading] = useState(true)
    const [scrollFlag, setScrollFlag] = useState(false)
    const [modalRoomEdit, setModalRoomEdit] = useState(false)
    const params = useParams()
    const navigate = useNavigate()
    const wrapperRef = useRef(null)
    const chatSocket = useRef(null)
    const [ref, inView] = useInView()
    const token = localStorage.getItem("token")

    function scrollToBottom() {
        if (wrapperRef.current) {
            wrapperRef.current.scrollIntoView(
                {
                    block: "start",
                    inline: "start"
                })
        }
    }

    async function sendMessage() {
        const sendingText = text.trim()
        setText("")
        setScrollFlag(true)
        if (sendingText.length > 0) {
            const message = { sender_id: user.pk, text: sendingText }
            await chatSocket.current.send(JSON.stringify({ message: message }))
        }
        setScrollFlag(false)
    }

    async function editRoom() {
        let subscribers = invitationChanges.subscribers.filter((user) => user.isInRoom === false)
        let friends = invitationChanges.friends.filter((user) => user.isInRoom === true)
        subscribers = subscribers.map((user) => {
            return user.pk
        })
        friends = friends.map((user) => {
            return user.pk
        })

        if (friends.length > 0 || subscribers.length > 0) {
            const data = { subscribers: subscribers, friends: friends }

            await myFetch({ action: `api/room/${params.room_id}/`, method: "PUT", body: data, token: token })
                .then((data) => {
                    if (data.status) {
                        navigate(`/chats/${user.username}/`)
                    }
                })
        }
    }

    async function fetchAddMessages() {
        setLoading(true)
        await myFetch({ action: `api/room/${params.room_id}/${messages.length}/`, method: "GET", token: token })
            .then((data) => {
                if (data.status) {
                    if (messages.length === 0) {
                        setScrollFlag(true)
                    } else {
                        setScrollFlag(false)
                    }
                    setMessages([...data.messages.reverse(), ...messages])
                }
                setLoading(false)
            })
    }

    useEffect(() => {
        const textArea = document.getElementsByClassName("TextArea").item(0)
        const sendButton = document.getElementById("SendButton")
        textArea.focus()
        textArea.onkeyup = function (e) {
            if (e.keyCode === 13) {
                sendButton.click()
            }
        }

        myFetch({ action: `api/room/${params.room_id}/`, method: "GET", token: token })
            .then((data) => {
                if (data.status) {
                    setIsCreator(data.isCreator)
                    setRoom(data.room)
                    invitationChanges.subscribers = data.room.subscribers_info.map((user) => {
                        return { ...user, isInRoom: true }
                    })
                }
            })
    }, [room.name])

    useEffect(() => {
        const socket = new WebSocket(
            "ws://"
            + process.env.REACT_APP_DJANGO_WEBSOCKET_HOST
            + "/ws/chat/"
            + params.room_id
            + "/"
        )
        socket.onopen = function (e) {
            console.log(`chatSocket: The connection in room ${params.room_id} was setup successfully!`)
        }
        socket.onclose = function (e) {
            console.warn(`chatSocket: in room ${params.room_id} something unexpected happened!`)
        }
        socket.onerror = function (e) {
            console.error(e)
        }

        chatSocket.current = socket

        return () => {
            socket.close()
        }
    }, [])

    useEffect(() => {
        chatSocket.current.onmessage = (e) => {
            const data = JSON.parse(e.data)
            if (data.status) {
                setScrollFlag(false)
                setMessages([...messages, data.message])
            }
        }
    }, [messages])


    useEffect(() => {
        if (scrollFlag && messages.length) {
            scrollToBottom()
        }
    }, [scrollFlag, messages])

    useObserver({ inView: inView, func: fetchAddMessages })

    return (
        <div className="Chat">
            <MainComponents user={user} roomName={room.name} />

            <Modal modal={modalRoomEdit} setModal={setModalRoomEdit}>
                <ModalRoomEdit room={room} setRoom={setRoom} isCreator={isCreator} me={user} editRoom={editRoom} invitationChanges={invitationChanges} setInvitationChanges={setInvitationChanges} />
            </Modal>

            <LazyDiv Ref={ref} />

            <div className="Messages">
                {loading && <Loading />}

                {messages.map((message) =>
                    <Message key={message.id} message={message} />
                )}
            </div>

            <div className="UserInput">
                <img id="SettingsButton" src={settingsLogo} onClick={() => setModalRoomEdit(true)} alt="settings button" />
                <textarea className="TextArea" maxLength="5000" placeholder="type text..." value={text} onChange={(e) => setText(e.target.value)} />
                <img id="SendButton" src={sendIcon} onClick={() => sendMessage()} alt="send button" />
            </div>

            <div className="Wrapper-Scrollbottom" ref={wrapperRef} ></div>
        </div>
    )
}