import '../styles/Chat.css'
import { useContext, useEffect, useRef, useState } from "react"
import { useParams } from 'react-router-dom'
import { UserContext } from "../data/context"
import { myFetch } from '../API/myFetch'
import MainComponents from "../components/MainComponents"
import Message from '../components/Message'
import Button from '../components/UI/Button'

export default function Chat() {

    const { user } = useContext(UserContext)
    const [messages, setMessages] = useState([])
    const [text, setText] = useState('')
    const params = useParams()
    const wrapperRef = useRef(null)
    const chatSocket = useRef(null)
    const token = localStorage.getItem('token')

    function scrollToBottom() {
        if (wrapperRef.current) {
            wrapperRef.current.scrollIntoView(
                {
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'nearest'
                })
        }
    }

    async function sendMessage() {
        const sendingText = text.trim()
        setText('')

        if (sendingText.length > 0) {
            const message = { sender: user.username, text: sendingText }
            await chatSocket.current.send(JSON.stringify({ message: message }))
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        const messageArea = document.getElementsByClassName('MessageArea').item(0)
        const sendButton = document.getElementById('SendButton')
        messageArea.focus()

        messageArea.onkeyup = function (e) {
            if (e.keyCode === 13) {
                sendButton.click()
            }
        }

        myFetch({ action: `api/room/${params.room_id}/`, method: 'GET', token: token })
            .then((data) => {
                if (data.status) {
                    setMessages(data.messages)
                }
            })
    }, [])

    useEffect(() => {
        const socket = new WebSocket(
            'ws://'
            + process.env.REACT_APP_DJANGO_WEBSOCKET_HOST
            + '/ws/chat/'
            + params.room_id
            + '/'
        )
        socket.onopen = function (e) {
            console.log(`chatSocket: The connection in room ${params.room_id} was setup successfully!`)
        }
        socket.onclose = function (e) {
            console.error(`chatSocket: in room ${params.room_id} something unexpected happened!`)
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

    return (
        <div className="Chat">
            <MainComponents user={user} />

            <div className='Messages'>
                {messages.map((message) =>
                    <Message key={message.id} message={message} />
                )}
            </div>

            <div className='UserInput'>
                <textarea className='MessageArea' placeholder="send message..." value={text} onChange={(e) => setText(e.target.value)} />
                <Button id="SendButton" onClick={() => sendMessage()} >send</Button>
            </div>

            <div className="Wrapper-Scrollbottom" ref={wrapperRef} ></div>
        </div>
    )
}