import cl from "../styles/Modal.module.css"

export default function Modal(props) {

    const rootClass = [cl.Modal]

    if (props.modal) {
        rootClass.push(cl.active)
    }

    return (
        <div className={rootClass.join(" ")} onClick={() => props.setModal(false)} >
            <div className={cl.ModalContent} onClick={e => e.stopPropagation()} >
                {props.children}
            </div>
        </div>
    )
}