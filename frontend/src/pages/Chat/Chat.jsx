import "./styles/Chat.css"
import { useContext, useEffect, useRef, useState } from "react"
import { useSignal } from "@preact/signals-react"
import { useNavigate, useParams } from "react-router-dom"
import { useInView } from "react-intersection-observer"
import { HttpMethod } from "@data/enums"
import { UserContext } from "@data/context"
import useObserver from "@hooks/useObserver"
import Fetch from "@API/Fetch"
import MainComponents from "@pages/components/MainComponents/MainComponents"
import Modal from "@pages/components/Modal"
import LazyDiv from "@pages/components/LazyDiv"
import ScrollToTopOrBottom from "@pages/components/MainComponents/components/ScrollToTopOrBottom"
import ModalRoomEdit from "@pages/Chat/components/modals/ModalRoomEdit"
import Messages from "@pages/Chat/components/Messages"
import UserInput from "@pages/Chat/components/UserInput"

export default function Chat() {

    const { user } = useContext(UserContext)
    const messages = useSignal([])
    const [modalRoomEdit, setModalRoomEdit] = useState(false)
    const mainSets = useSignal({
        room: {
            id: undefined,
            name: "",
            subscribers_info: []
        },
        isCreator: false,
        loading: false,
        invitationChanges: {
            friends: [],
            subscribers: []
        }
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

    async function sendMessage(text) {
        const sendingText = text.trim()
        if (sendingText.length > 0) {
            const message = { sender_id: user.pk, text: sendingText }
            await chatSocket.current.send(JSON.stringify({ message: message }))
        }
    }

    async function editRoom() {
        let subscribers = mainSets.value.invitationChanges.subscribers.filter((user) => user.isInRoom === false)
        let friends = mainSets.value.invitationChanges.friends.filter((user) => user.isInRoom === true)
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

    async function fetchAddMessages(flag) {
        const msgs_len = messages.value.length
        if (flag || msgs_len > 0) {
            mainSets.value.loading = true
            const data = await Fetch({ action: `api/room/${params.room_id}/${msgs_len}/`, method: HttpMethod.GET })
            if (data && data.ok) {
                messages.value = [...data.messages.reverse(), ...messages.value]
            }
            mainSets.value.loading = false
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
                    mainSets.value.isCreator = data.isCreator
                    mainSets.value.room = data.room
                    mainSets.value.invitationChanges.subscribers = data.room.subscribers_info.map((user) => {
                        return { ...user, isInRoom: true }
                    })
                }
            })
    }, [mainSets.value.room.id])

    useEffect(() => {
        fetchAddMessages(true)
    }, [])

    useEffect(() => {
        const socket = new WebSocket(
            process.env.REACT_APP_SERVER_WEBSOCKET_URL
            + `chat/${params.room_id}/`
            + `?token=${localStorage.getItem('token')}`
        )
        socket.onopen = () => {
            console.log(`chatSocket: The connection in room was setup successfully.`)
        }
        socket.onclose = () => {
            console.log(`chatSocket: room has already closed.`)
        }
        socket.onerror = (e) => {
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
                messages.value = [...messages.value, data.message]
            }
            scrollToBottom()
        }
    }, [messages.value])

    useEffect(() => {
        if (inViewWrapper) {
            scrollToBottom()
        }
    }, [inViewWrapper, messages.value.length])

    useObserver({ inView: inViewLazyDiv, func: fetchAddMessages })

    return (
        <div className="Chat">
            <MainComponents user={user} roomName={mainSets.value.room.name} loading={mainSets.value.loading} />

            <ScrollToTopOrBottom bottom={true} />

            <Modal modal={modalRoomEdit} setModal={setModalRoomEdit}>
                <ModalRoomEdit mainSets={mainSets} me={user} editRoom={editRoom} />
            </Modal>

            <LazyDiv Ref={refLazyDivinView} />

            <Messages messages={messages.value} />

            <UserInput sendMessage={sendMessage} setModalRoomEdit={setModalRoomEdit} />

            <div className="Wrapper-InView" ref={wrapperRef} ></div>

            <div className="Wrapper-Scrollbottom" ref={refWrapperinView} ></div>
        </div>
    )
}