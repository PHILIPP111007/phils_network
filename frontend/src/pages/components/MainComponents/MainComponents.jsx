import { useRef, useState } from "react"
import Modal from "../Modal"
import SettingsBar from "./components/SettingsBar"
import UpperLine from "./components/UpperLine"
import ModalSettings from "./components/modals/ModalSettings"
import ModalDelAcc from "./components/modals/ModalDelAcc"
import NavBar from "./components/NavBar"
import ScrollToTop from "./components/ScrollToTop"

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