import { useState } from "react"
import settingsLogo from "@images/three_points_gray.svg"
import sendIcon from "@images/send-icon.svg"

export default function UserInput({ sendMessage, setModalRoomEdit }) {

    var [text, setText] = useState("")

    return (
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
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <img id="SendButton" src={sendIcon} onClick={() => {
                sendMessage(text)
                setText("")
            }} alt="send button" />
        </div>
    )
}