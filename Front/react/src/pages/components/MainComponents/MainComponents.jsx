import { useRef, useState } from "react"
import Modal from "../Modal"
import SettingsBar from "./components/SettingsBar"
import UpperLine from "./components/UpperLine"
import ModalSettings from "./components/modals/ModalSettings"
import ModalDelAcc from "./components/modals/ModalDelAcc"
import NavBar from "./components/NavBar"

export default function MainComponents(props) {

    var [modalSettings, setModalSettings] = useState(false)
    var [modalDelAcc, setModalDelAcc] = useState(false)
    var setBarRef = useRef()

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