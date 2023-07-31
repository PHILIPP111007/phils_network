import { useRef, useState } from "react"
import Modal from "./Modal"
import SettingsBar from "./SettingsBar"
import UpperLine from "./UpperLine"
import ModalSettings from "./modals/ModalSettings"
import ModalDelAcc from "./modals/ModalDelAcc"
import NavBar from "./NavBar"
import ScrollToTop from "./ScrollToTop"

export default function MainComponents(props) {

    const [modalSettings, setModalSettings] = useState(false)
    const [modalDelAcc, setModalDelAcc] = useState(false)
    const setBarRef = useRef()

    return (
        <div className="MainComponents">
            <UpperLine user={props.user} setBarRef={setBarRef} roomName={props.roomName} />

            <NavBar />

            <SettingsBar setBarRef={setBarRef} setModalSettings={setModalSettings} />

            <Modal modal={modalSettings} setModal={setModalSettings}>
                <ModalSettings setModalSettings={setModalSettings} setModalDelAcc={setModalDelAcc} />
            </Modal>

            <Modal modal={modalDelAcc} setModal={setModalDelAcc}>
                <ModalDelAcc />
            </Modal>

            <ScrollToTop />
        </div>
    )
}