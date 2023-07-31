import '../../styles/ModalPostEdit.css'
import Button from "../UI/Button"

export default function ModalPostCreate(props) {
    return (
        <div className='ModalPostEdit'>
            <div>
                <textarea value={props.text} maxLength="5000" onChange={(e) => props.setText(e.target.value)} />
            </div>
            <Button onClick={() => props.createPost(props.text)} >create</Button>
        </div>
    )
}