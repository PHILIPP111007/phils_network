import "./styles/Chat.css"
import { useContext, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useInView } from "react-intersection-observer"
import { UserContext } from "../../data/context"
import useObserver from "../../hooks/useObserver"
import Fetch from "../../API/Fetch"
import MainComponents from "../components/MainComponents/MainComponents"
import Modal from "../components/Modal"
import LazyDiv from "../components/LazyDiv"
import Loading from "../components/Loading"
import ModalRoomEdit from "./components/modals/ModalRoomEdit"
import Message from "./components/Message"
import sendIcon from "../../images/send-icon.svg"
import settingsLogo from "../../images/three_points_gray.svg"

export default function Chat() {

    const { user } = useContext(UserContext)
    const [messages, setMessages] = useState([])
    const [modalRoomEdit, setModalRoomEdit] = useState(false)

    const [mainSets, setMainSets] = useState({
        room: { id: undefined, name: "", subscribers_info: [] },
        isCreator: false,
        loading: true,
        text: "",
        invitationChanges: { friends: [], subscribers: [] },
    })
    
    const params = useParams()
    const navigate = useNavigate()
    const chatSocket = useRef(null)
    const wrapperRef = useRef(null)
    const [refLazyDivinView, inViewLazyDiv] = useInView()
    const [refWrapperinView, inViewWrapper] = useInView()
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
        const sendingText = mainSets.text.trim()
        setMainSets({...mainSets, text: ""})
        if (sendingText.length > 0) {
            const message = { sender_id: user.pk, text: sendingText }
            await chatSocket.current.send(JSON.stringify({ message: message }))
        }
    }

    async function editRoom() {
        let subscribers = mainSets.invitationChanges.subscribers.filter((user) => user.isInRoom === false)
        let friends = mainSets.invitationChanges.friends.filter((user) => user.isInRoom === true)
        subscribers = subscribers.map((user) => {
            return user.pk
        })
        friends = friends.map((user) => {
            return user.pk
        })

        if (friends.length > 0 || subscribers.length > 0) {
            const data = { subscribers: subscribers, friends: friends }

            await Fetch({ action: `api/room/${params.room_id}/`, method: "PUT", body: data, token: token })
                .then((data) => {
                    if (data.status) {
                        navigate(`/chats/${user.username}/`)
                    }
                })
        }
    }

    async function fetchAddMessages() {
        setMainSets({...mainSets, loading: true})
        await Fetch({ action: `api/room/${params.room_id}/${messages.length}/`, method: "GET", token: token })
            .then((data) => {
                if (data.status) {
                    setMessages([...data.messages.reverse(), ...messages])
                }
                setMainSets({...mainSets, loading: false})
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

        Fetch({ action: `api/room/${params.room_id}/`, method: "GET", token: token })
            .then((data) => {
                if (data.status) {
                    setMainSets({...mainSets, isCreator: data.isCreator, room: data.room})
                    
                    mainSets.invitationChanges.subscribers = data.room.subscribers_info.map((user) => {
                        return { ...user, isInRoom: true }
                    })
                }
            })
    }, [mainSets.room.name])

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
                setMessages([...messages, data.message])
            }
        }
    }, [messages])

    useEffect(() => {
        if (inViewWrapper) {
            scrollToBottom()
        }
    }, [inViewWrapper, messages.length])

    useObserver({ inView: inViewLazyDiv, func: fetchAddMessages })

    return (
        <div className="Chat">
            <MainComponents user={user} roomName={mainSets.room.name} />

            <Modal modal={modalRoomEdit} setModal={setModalRoomEdit}>
                <ModalRoomEdit mainSets={mainSets} setMainSets={setMainSets} me={user} editRoom={editRoom} />
            </Modal>

            <LazyDiv Ref={refLazyDivinView} />

            <div className="Messages">
                {mainSets.loading && <Loading />}

                {messages.map((message) =>
                    <Message key={message.id} message={message} />
                )}
            </div>

            <div className="UserInput">
                <img
                    id="SettingsButton"
                    src={settingsLogo}
                    onClick={() => setModalRoomEdit(true)} alt="settings button"
                />
                <textarea
                    className="TextArea"
                    maxLength="5000"
                    placeholder="type text..."
                    value={mainSets.text}
                    onChange={(e) => setMainSets({...mainSets, text: e.target.value})}
                />
                <img id="SendButton" src={sendIcon} onClick={() => sendMessage()} alt="send button" />
            </div>

            <div className="Wrapper-InView" ref={wrapperRef} ></div>

            <div className="Wrapper-Scrollbottom" ref={refWrapperinView} ></div>
        </div>
    )
}