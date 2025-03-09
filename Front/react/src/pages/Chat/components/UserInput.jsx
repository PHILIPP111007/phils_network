import "./styles/UserInput.css"
import { useState, use } from "react"
import { UserContext } from "../../../data/context"
import Modal from "../../components/Modal"
import ModalRoomEdit from "../../Chat/components/components/ModalRoomEdit"
import Input from "../../components/UI/Input"
import settingsLogo from "../../../images/three_points_gray.svg"
import sendIcon from "../../../images/send-icon.svg"

export default function UserInput({ mainSets, sendMessage, editRoom, sendFileMessage }) {

    var { user } = use(UserContext)
    var [modalRoomEdit, setModalRoomEdit] = useState(false)
    var [text, setText] = useState("")

    return (
        <>
            <Modal modal={modalRoomEdit} setModal={setModalRoomEdit}>
                <ModalRoomEdit mainSets={mainSets} me={user} editRoom={editRoom} />
            </Modal>

            <div className="UserInput">
                <form onSubmit={e => sendFileMessage(e)} className="uploadFileForm">
                    <Input id="uploadFileInput" type="file" />
                    <Input type="submit" value="Send file" />
                </form>
                <img
                    id="SettingsButton"
                    src={settingsLogo}
                    onClick={() => setModalRoomEdit(true)} alt="settings button"
                />
                <textarea
                    className="TextArea"
                    placeholder="Use markdown to format your text..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <img id="SendButton" src={sendIcon} onClick={() => {
                    sendMessage(text)
                    setText("")
                }} alt="send button" />
            </div>
        </>
    )
}