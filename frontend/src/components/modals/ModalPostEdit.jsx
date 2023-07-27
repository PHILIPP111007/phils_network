import '../../styles/ModalPostEdit.css'
import Button from "../UI/Button"

export default function ModalPostEdit(props) {
    return (
        <div className='ModalPostEdit'>
            <div>
                <textarea value={props.post.content} onChange={(e) => props.setPost({ ...props.post, content: e.target.value })} />
            </div>
            <Button onClick={() => props.editPost(props.post)} >edit</Button>
            <Button onClick={() => props.deletePost(props.post)} >delete</Button>
        </div>
    )
}