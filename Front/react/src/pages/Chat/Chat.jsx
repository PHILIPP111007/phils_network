import "./styles/Chat.css"
import { useContext, useEffect, useRef, useState } from "react"
import { useSignal } from "@preact/signals-react"
import { useNavigate, useParams } from "react-router-dom"
import { useInView } from "react-intersection-observer"
import { HttpMethod, LocalStorageKeys } from "@data/enums"
import { UserContext } from "@data/context"
import useObserver from "@hooks/useObserver"
import getWebSocket from "@modules/websocket"
import Fetch from "@API/Fetch"
import MainComponents from "@pages/components/MainComponents/MainComponents"
import LazyDiv from "@pages/components/LazyDiv"
import ScrollToTopOrBottom from "@pages/components/MainComponents/components/ScrollToTopOrBottom"
import Messages from "@pages/Chat/components/Messages"
import UserInput from "@pages/Chat/components/UserInput"

export default function Chat() {

    var { user } = useContext(UserContext)
    var [messages, setMessages] = useState([])
    var mainSets = useSignal({
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
    var params = useParams()
    var navigate = useNavigate()
    var chatSocket = useRef(null)
    var wrapperRef = useRef(null)
    var [refLazyDivinView, inViewLazyDiv] = useInView()
    var [refWrapperinView, inViewWrapper] = useInView()

    function scrollToBottom() {
        if (wrapperRef.current) {
            wrapperRef.current.scrollIntoView({
                block: "start",
                inline: "start"
            })
        }
    }

    class MessagesByRoomLocalStorage {
        static get_key() {
            return `${LocalStorageKeys.MESSAGES}_${mainSets.value.room.id}`
        }
        static get() {
            var messages_by_room = localStorage.getItem(this.get_key())
            return JSON.parse(messages_by_room)
        }
        static save(messages) {
            var msgs_slice = 30
            try {
                localStorage.setItem(this.get_key(), JSON.stringify(messages.slice(-msgs_slice)))
            } catch (e) {
                this.delete()
                console.error(e)
            }
        }
        static delete() {
            localStorage.removeItem(this.get_key())
        }
    }

    class RoomsLocalStorage {
        static get_key() {
            return `${LocalStorageKeys.ROOMS}_${user.username}`
        }
        static update(username, text) {
            var rooms = localStorage.getItem(this.get_key())
            if (rooms !== null) {
                rooms = JSON.parse(rooms)
                var current_room = rooms.filter((room) => room.id === mainSets.value.room.id)[0]
                current_room.last_message_sender = username
                current_room.last_message_text = text
                rooms = [current_room, ...rooms.filter((room) => room.id !== mainSets.value.room.id)]
                localStorage.setItem(this.get_key(), JSON.stringify(rooms))
            }
        }
        static delete() {
            localStorage.removeItem(this.get_key())
        }
    }

    async function sendMessage(text) {
        var sendingText = await text.trim()
        if (sendingText.length > 0) {
            var message = { sender_id: user.pk, text: sendingText }
            RoomsLocalStorage.update(user.username, sendingText)
            await chatSocket.current.send(JSON.stringify({ message: message }))
        }
    }

    async function editRoom() {
        var subscribers = mainSets.value.invitationChanges.subscribers.filter((user) => user.isInRoom === false)
        var friends = mainSets.value.invitationChanges.friends.filter((user) => user.isInRoom === true)
        subscribers = subscribers.map((user) => {
            return user.pk
        })
        friends = friends.map((user) => {
            return user.pk
        })

        if (friends.length > 0 || subscribers.length > 0) {
            var body = { subscribers: subscribers, friends: friends }

            var data = await Fetch({ action: `api/room/${params.room_id}/`, method: HttpMethod.PUT, body: body })
            if (data && data.ok) {
                RoomsLocalStorage.delete()
                navigate(`/chats/${user.username}/`)
            }
        }
    }

    async function fetchAddMessages(flag) {
        var msgs_len = messages.length
        if (flag || msgs_len > 0) {
            mainSets.value.loading = true
            var data = await Fetch({ action: `api/room/${params.room_id}/${msgs_len}/`, method: HttpMethod.GET })

            if (data) {
                if (data.ok) {
                    setMessages((prev) => [...data.messages.reverse(), ...messages])
                    MessagesByRoomLocalStorage.save(messages)
                } else {
                    MessagesByRoomLocalStorage.delete()
                    RoomsLocalStorage.delete()
                }
            }
            mainSets.value.loading = false
        }
    }

    useEffect(() => {
        Fetch({ action: `api/room/${params.room_id}/`, method: HttpMethod.GET })
            .then((data) => {
                if (data && data.ok) {
                    mainSets.value.isCreator = data.isCreator
                    mainSets.value.room = data.room
                    mainSets.value.invitationChanges.subscribers = data.room.subscribers_info.map((user) => {
                        return { ...user, isInRoom: true }
                    })

                    var messages_by_room = MessagesByRoomLocalStorage.get()
                    if (messages_by_room && messages_by_room.length > 0) {
                        setMessages(messages_by_room)
                    }
                    fetchAddMessages(true)
                }
            })

        chatSocket.current = getWebSocket({ socket_name: "chatSocket", path: `chat/${params.room_id}/` })

        var textArea = document.getElementsByClassName("TextArea").item(0)
        var sendButton = document.getElementById("SendButton")
        textArea.focus()
        textArea.onkeyup = function (e) {
            if (e.keyCode === 13) {
                sendButton.click()
            }
        }

        return () => {
            chatSocket.current.close()
        }
    }, [])

    useEffect(() => {
        chatSocket.current.onmessage = (e) => {
            var data = JSON.parse(e.data)
            if (data) {
                setMessages((prev) => [...messages, data.message])
                MessagesByRoomLocalStorage.save(messages)
                RoomsLocalStorage.update(data.message.sender.username, data.message.text)
            }
            scrollToBottom()
        }
    }, [messages])

    useEffect(() => {
        if (inViewWrapper) {
            scrollToBottom()
        }
    }, [inViewWrapper, messages.length])

    useObserver({ inView: inViewLazyDiv, func: fetchAddMessages, flag: !mainSets.value.loading })

    return (
        <div className="Chat">
            <MainComponents roomName={mainSets.value.room.name} loading={mainSets.value.loading} />

            <ScrollToTopOrBottom bottom={true} />

            <LazyDiv Ref={refLazyDivinView} />

            <Messages messages={messages} />

            <UserInput mainSets={mainSets} sendMessage={sendMessage} editRoom={editRoom} />

            <div className="Wrapper-InView" ref={wrapperRef} ></div>

            <div className="Wrapper-Scrollbottom" ref={refWrapperinView} ></div>
        </div>
    )
}
