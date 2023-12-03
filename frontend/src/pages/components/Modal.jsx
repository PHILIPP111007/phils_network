import { useMemo } from "react"
import cl from "./styles/Modal.module.css"

export default function Modal(props) {

    function closeModalByESC(e) {
        if (e.key === "Escape" && props.modal) { // escape key maps to keycode `27`
            props.setModal(false)
            document.removeEventListener("keyup", closeModalByESC)
        }
    }

    var showModalChildren = useMemo(() => {
        document.addEventListener("keyup", closeModalByESC)

        if (props.modal === true) {
            var rootClass = [cl.Modal]
            rootClass.push(cl.active)

            return (
                <div className={rootClass.join(" ")} onClick={() => {
                    props.setModal(false)
                    document.removeEventListener("keyup", closeModalByESC)
                }} >
                    <div className={cl.ModalContent} onClick={e => e.stopPropagation()} >
                        {props.children}
                    </div>
                </div>
            )
        }

    }, [props.modal, props.children])

    return showModalChildren
}