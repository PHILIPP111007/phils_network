import "./styles/Chat.css"
import { useContext, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useInView } from "react-intersection-observer"
import { HttpMethod } from "../../data/enums"
import { UserContext } from "../../data/context"
import useObserver from "../../hooks/useObserver"
import Fetch from "../../API/Fetch"
import MainComponents from "../components/MainComponents/MainComponents"
import Modal from "../components/Modal"
import LazyDiv from "../components/LazyDiv"
import ScrollToTopOrBottom from "../components/MainComponents/components/ScrollToTopOrBottom"
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
        loading: false,
        text: "",
        invitationChanges: { friends: [], subscribers: [] },
    })

    const params = useParams()
    const navigate = useNavigate()
    const chatSocket = useRef(null)
    const wrapperRef = useRef(null)
    const [refLazyDivinView, inViewLazyDiv] = useInView()
    const [refWrapperinView, inViewWrapper] = useInView()

    function scrollToBottom() {
        if (wrapperRef.current) {
            wrapperRef.current.scrollIntoView({
                block: "start",
                inline: "start"
            })
        }
    }

    async function sendMessage() {
        const sendingText = mainSets.text.trim()
        setMainSets({ ...mainSets, text: "" })
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
            const body = { subscribers: subscribers, friends: friends }

            const data = await Fetch({ action: `api/room/${params.room_id}/`, method: HttpMethod.PUT, body: body })
            if (data && data.ok) {
                navigate(`/chats/${user.username}/`)
            }
        }
    }

    async function fetchAddMessages(bool) {
        if (bool || messages.length > 0) {
            setMainSets({ ...mainSets, loading: true })

            const data = await Fetch({ action: `api/room/${params.room_id}/${messages.length}/`, method: HttpMethod.GET })
            if (data && data.ok) {
                setMessages([...data.messages.reverse(), ...messages])
            }
            setMainSets({ ...mainSets, loading: false })
        }
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

        Fetch({ action: `api/room/${params.room_id}/`, method: HttpMethod.GET })
            .then((data) => {
                if (data && data.ok) {
                    setMainSets({ ...mainSets, isCreator: data.isCreator, room: data.room })

                    mainSets.invitationChanges.subscribers = data.room.subscribers_info.map((user) => {
                        return { ...user, isInRoom: true }
                    })
                }
            })
    }, [mainSets.room.id])

    useEffect(() => {
        fetchAddMessages(true)
    }, [])

    useEffect(() => {
        const socket = new WebSocket(
            process.env.REACT_APP_SERVER_WEBSOCKET_URL
            + params.room_id
            + "/"
        )
        socket.onopen = function (e) {
            console.log(`chatSocket: The connection in room ${params.room_id} was setup successfully!`)
        }
        socket.onclose = function (e) {
            console.warn(`chatSocket: room ${params.room_id} has already closed.`)
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
            if (data) {
                setMessages([...messages, data.message])
            }
            scrollToBottom()
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
            <MainComponents user={user} roomName={mainSets.room.name} loading={mainSets.loading} />

            <ScrollToTopOrBottom bottom={true} />

            <Modal modal={modalRoomEdit} setModal={setModalRoomEdit}>
                <ModalRoomEdit mainSets={mainSets} setMainSets={setMainSets} me={user} editRoom={editRoom} />
            </Modal>

            <LazyDiv Ref={refLazyDivinView} />

            <div className="Messages">
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
                    onChange={(e) => setMainSets({ ...mainSets, text: e.target.value })}
                />
                <img id="SendButton" src={sendIcon} onClick={() => sendMessage()} alt="send button" />
            </div>

            <div className="Wrapper-InView" ref={wrapperRef} ></div>

            <div className="Wrapper-Scrollbottom" ref={refWrapperinView} ></div>
        </div>
    )
}