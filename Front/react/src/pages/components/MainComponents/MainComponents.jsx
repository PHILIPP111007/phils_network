import { useRef, useState, useEffect, use } from "react"
import { AuthContext, UserContext } from "../../../data/context.js"
import { getWebSocketDjango } from "../../../modules/getWebSocket.js"
import Modal from "../../components/Modal.jsx"
import SettingsBar from "../../components/MainComponents/components/SettingsBar.jsx"
import UpperLine from "../../components/MainComponents/components/UpperLine.jsx"
import ModalSettings from "../../components/MainComponents/components/ModalSettings.jsx"
import ModalDelAcc from "../../components/MainComponents/components/ModalDelAcc.jsx"
import NavBar from "../../components/MainComponents/components/NavBar.jsx"

export default function MainComponents(props) {

    var { isAuth } = use(AuthContext)
    var { user } = use(UserContext)
    var [modalSettings, setModalSettings] = useState(false)
    var [modalDelAcc, setModalDelAcc] = useState(false)
    var setBarRef = useRef()

    useEffect(() => {
        if (isAuth) {
            var onlineStatusSocket = getWebSocketDjango({ socket_name: "OnlineSocket", path: `online_status/${user.id}/` })

            return () => {
                onlineStatusSocket.close()
            }
        }
    }, [isAuth])

    return (
        <div className="MainComponents">
            <UpperLine setBarRef={setBarRef} roomName={props.roomName} loading={props.loading} />

            <NavBar />

            <SettingsBar setBarRef={setBarRef} setModalSettings={setModalSettings} />

            <Modal modal={modalSettings} setModal={setModalSettings}>
                <ModalSettings setModalSettings={setModalSettings} setModalDelAcc={setModalDelAcc} />
            </Modal>

            <Modal modal={modalDelAcc} setModal={setModalDelAcc}>
                <ModalDelAcc />
            </Modal>
        </div>
    )
}