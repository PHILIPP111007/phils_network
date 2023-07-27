import '../../styles/ModalDelAcc.css'
import Button from "../UI/Button"

export default function ModalDelAcc(props) {
    return (
        <div className='ModalDelAcc'>
            <h2>Are you sure?</h2>
            <br />
            <Button onClick={() => props.setModalDelAcc(false)} >delete account</Button>
        </div>
    )
}