import { useSignal } from "@preact/signals-react"
import settingsLogo from "@images/three_points_gray.svg"
import sendIcon from "@images/send-icon.svg"

export default function UserInput({ sendMessage, setModalRoomEdit }) {

    var text = useSignal("")

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
                value={text.value}
                onChange={(e) => text.value = e.target.value}
            />
            <img id="SendButton" src={sendIcon} onClick={() => {
                sendMessage(text.value)
                text.value = ""
            }} alt="send button" />
        </div>
    )
}