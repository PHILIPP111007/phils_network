import "./styles/Chat.css"
import { useEffect, useRef, useState, useCallback, use } from "react"
import { useSignal } from "@preact/signals-react"
import { useNavigate, useParams } from "react-router-dom"
import { useInView } from "react-intersection-observer"
import { HttpMethod, APIVersion, LikeOrUnlike } from "../../data/enums.js"
import { UserContext } from "../../data/context.js"
import { PROD_FETCH_URL } from "../../data/constants.js"
import rememberPage from "../../modules/rememberPage.js"
import getToken from "../../modules/getToken.js"
import useObserver from "../../hooks/useObserver"
import { getWebSocketDjango } from "../../modules/getWebSocket.js"
import Fetch from "../../API/Fetch.js"
import MainComponents from "../components/MainComponents/MainComponents.jsx"
import LazyDiv from "../components/LazyDiv.jsx"
import ScrollToTopOrBottom from "../components/MainComponents/components/ScrollToTopOrBottom.jsx"
import Messages from "./components/Messages.jsx"
import UserInput from "./components/UserInput.jsx"

export default function Chat() {

    var { user } = use(UserContext)
    var [messages, setMessages] = useState([])
    var [parentId, setParentId] = useState(null)
    var [parentMessage, setParentMessage] = useState(null)
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
    var likeMessageSocket = useRef(null)
    var deleteMessageSocket = useRef(null)
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

    async function sendMessage(text, file) {
        var sendingText = await text.trim()

        var message = null
        if (file) {
            var formData = new FormData()
            formData.append("file", file)
            formData.append("text", sendingText)

            var data = await Fetch({
                api_version: APIVersion.V1, action: `file_upload/${params.room_id}/`, method: HttpMethod.POST, body: formData, is_uploading_file: true
            })

            var arrayBuffer = await file.arrayBuffer()
            var file_content = Array.from(new Uint8Array(arrayBuffer))

            if (data && data.ok) {
                message = {
                    ...data.message,
                    file: {
                        path: data.message.file,
                        content: file_content
                    },
                    sender_id: user.id,
                    text: sendingText,
                    sender: {
                        username: user.username,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        image: user.image,
                    },
                    parent_id: parentId,
                    likes: 0,
                }
                await chatSocket.current.send(JSON.stringify({ message: message }))
            }
        } else {
            if (sendingText.length > 0) {
                message = {
                    sender_id: user.id,
                    text: sendingText,
                    parent_id: parentId,
                    sender: {
                        username: user.username,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        image: user.image,
                    },
                    file: {
                        path: null,
                        content: null
                    },
                    room: mainSets.value.room.id,
                    likes: 0,
                }
                await chatSocket.current.send(JSON.stringify({ message: message }))
            }
        }

        setParentId(null)
    }

    async function downloadFile(message) {
        try {
            var action = `api/v1/file_download/${message.id}/${user.username}/`
            var token = getToken()

            var response = await fetch(`${PROD_FETCH_URL}${action}`, {
                method: "GET",
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Authorization": token ? `Token ${token}` : "",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            let filename = message.file.path.split("/").pop()
            var blob = await response.blob()
            var url = URL.createObjectURL(blob)

            var a = document.createElement("a")
            document.body.appendChild(a)
            a.style = "display: none"
            a.href = url
            a.download = filename
            a.click()

            setTimeout(() => {
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
            }, 100);

        } catch (error) {
            console.error("Download error:", error)
        }
    }

    async function editRoom() {
        var subscribers = mainSets.value.invitationChanges.subscribers.filter((user) => user.isInRoom === false)
        var friends = mainSets.value.invitationChanges.friends.filter((user) => user.isInRoom === true)
        subscribers = subscribers.map((user) => {
            return user.id
        })
        friends = friends.map((user) => {
            return user.id
        })

        if (friends.length > 0 || subscribers.length > 0) {
            var body = { subscribers: subscribers, friends: friends }

            var data = await Fetch({ api_version: APIVersion.V2, action: `room/${params.room_id}/`, method: HttpMethod.PUT, body: body })
            if (data && data.ok) {
                navigate(`/chats/${user.username}/`)
            }
        }
    }

    async function fetchAddMessages(flag) {
        var msgs_len = messages.length
        if (flag || msgs_len > 0) {
            mainSets.value.loading = true
            var data = await Fetch({ api_version: APIVersion.V2, action: `room/${params.room_id}/${msgs_len}/`, method: HttpMethod.GET })

            if (data && data.ok) {
                setMessages((prev) => [...data.messages.reverse(), ...messages])

                data.messages.forEach(message => {
                    Fetch({ api_version: APIVersion.V2, action: `message_viewed/${message.id}/`, method: HttpMethod.POST })
                })
            }
            mainSets.value.loading = false
        }
    }

    async function deleteMessage(message) {
        var data = { message: { message_id: message.id, room_id: mainSets.value.room.id } }
        deleteMessageSocket.current.send(JSON.stringify(data))
    }

    async function likeMessage(messageId) {
        var data = await Fetch({ api_version: APIVersion.V2, action: `like_message/${messageId}/`, method: HttpMethod.POST })

        if (data && data.ok) {
            var message = {
                room_id: mainSets.value.room.id,
                message_id: messageId,
                like_or_unlike: LikeOrUnlike.LIKE,
            }
            await likeMessageSocket.current.send(JSON.stringify({ message: message }))
        }
    }

    async function unLikeMessage(messageId) {
        var data = await Fetch({ api_version: APIVersion.V2, action: `unlike_message/${messageId}/`, method: HttpMethod.POST })

        if (data && data.ok) {
            var message = {
                room_id: mainSets.value.room.id,
                message_id: messageId,
                like_or_unlike: LikeOrUnlike.UNLIKE,
            }
            await likeMessageSocket.current.send(JSON.stringify({ message: message }))
        }
    }

    var handleMessageLike = useCallback((e) => {
        var data = JSON.parse(e.data).message
        if (data) {
            setMessages((prevMessages) =>
                prevMessages.map((message) => {
                    if (message.id === data.message_id) {
                        var change = data.like_or_unlike === LikeOrUnlike.LIKE ? 1 : -1
                        var newLikes = message.likes + change
                        if (newLikes < 0) {
                            newLikes = 0
                        }
                        return { ...message, likes: newLikes }
                    }
                    return message
                })
            )
        }
    }, [])

    useEffect(() => {
        Fetch({ api_version: APIVersion.V2, action: `room/${params.room_id}/`, method: HttpMethod.GET })
            .then((data) => {
                if (data && data.ok) {
                    mainSets.value.isCreator = data.isCreator
                    mainSets.value.room = data.room

                    mainSets.value.invitationChanges.subscribers = data.room.subscribers_info.map((user) => {
                        return { ...user, isInRoom: true }
                    })

                    rememberPage(`chats/${params.username}/${data.room.id}`)

                    fetchAddMessages(true)
                }
            })

        chatSocket.current = getWebSocketDjango({ socket_name: "chatSocket", path: `chat/${params.room_id}/${user.id}/` })
        deleteMessageSocket.current = getWebSocketDjango({ socket_name: "deleteMessageSocket", path: `chat/${params.room_id}/${user.id}/delete_message/` })
        likeMessageSocket.current = getWebSocketDjango({ socket_name: "likeMessageSocket", path: `chat/${params.room_id}/${user.id}/like_message/` })

        var textArea = document.getElementsByClassName("TextArea").item(0)
        var sendButton = document.getElementById("SendButton")
        textArea.focus()
        textArea.onkeyup = function (e) {
            if (e.keyCode === 13 && !e.shiftKey) {
                sendButton.click()
            }
        }

        return () => {
            chatSocket.current.close()
            deleteMessageSocket.current.close()
            likeMessageSocket.current.close()
        }
    }, [])

    useEffect(() => {
        chatSocket.current.onmessage = (e) => {
            var data = JSON.parse(e.data)
            if (data && data.message.id) {
                setMessages((prev) => [...messages, data.message])
                Fetch({ api_version: APIVersion.V2, action: `message_viewed/${data.message.id}/`, method: HttpMethod.POST })
            }
            scrollToBottom()
        }
    }, [messages])

    useEffect(() => {
        deleteMessageSocket.current.onmessage = (e) => {
            var data = JSON.parse(e.data).message
            if (data) {
                setMessages((prev) => messages.filter(message => {
                    return message.id !== data.message_id
                }))
            }
        }
    }, [messages])

    useEffect(() => {
        likeMessageSocket.current.onmessage = handleMessageLike

        return () => {
            likeMessageSocket.current.onmessage = null
        };
    }, [handleMessageLike])

    useEffect(() => {
        if (inViewWrapper && !mainSets.value.loading) {
            scrollToBottom()
        }
    }, [inViewWrapper, messages.length, mainSets.value.loading])

    useEffect(() => {
        if (parentId !== null) {
            var message = messages.filter((msg) => {
                return msg.id === parentId
            })
            message = message[0]
            setParentMessage({ ...message })
        } else {
            setParentMessage(null)
        }
    }, [parentId])


    useObserver({ inView: inViewLazyDiv, func: fetchAddMessages, flag: !mainSets.value.loading })

    return (
        <div className="Chat">
            <MainComponents roomName={mainSets.value.room.name} loading={mainSets.value.loading} />

            <ScrollToTopOrBottom bottom={true} />

            <LazyDiv Ref={refLazyDivinView} />

            <Messages messages={messages} downloadFile={downloadFile} deleteMessage={deleteMessage} setParentId={setParentId} likeMessage={likeMessage} unLikeMessage={unLikeMessage} handleMessageLike={handleMessageLike} />

            <UserInput mainSets={mainSets} sendMessage={sendMessage} editRoom={editRoom} parentMessage={parentMessage} />

            <div className="Wrapper-InView" ref={wrapperRef} ></div>

            <div className="Wrapper-Scrollbottom" ref={refWrapperinView} ></div>
        </div>
    )
}
