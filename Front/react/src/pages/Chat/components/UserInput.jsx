import { useContext, useState } from "react"
import { UserContext } from "../../../data/context"
import Modal from "../../components/Modal"
import ModalRoomEdit from "./modals/ModalRoomEdit"
import settingsLogo from "@images/three_points_gray.svg"
import sendIcon from "@images/send-icon.svg"

export default function UserInput({ mainSets, sendMessage, editRoom }) {

    var { user } = useContext(UserContext)
    var [modalRoomEdit, setModalRoomEdit] = useState(false)
    var [text, setText] = useState("")

    return (
        <>
            <Modal modal={modalRoomEdit} setModal={setModalRoomEdit}>
                <ModalRoomEdit mainSets={mainSets} me={user} editRoom={editRoom} />
            </Modal>

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
        </>
    )
}