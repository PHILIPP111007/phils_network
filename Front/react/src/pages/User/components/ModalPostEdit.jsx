import "./styles/ModalPostEdit.css"
import Button from "../../components/UI/Button"

export default function ModalPostEdit(props) {
    return (
        <div className="ModalPostEdit">
            <textarea
                value={props.mainSets.post.content}
                maxLength="5000"
                placeholder="Use markdown to format your text..."
                onChange={(e) => props.setMainSets({
                    ...props.mainSets,
                    post: { ...props.mainSets.post, content: e.target.value }
                })}
            />
            <Button onClick={() => props.editPost(props.mainSets.post)} >edit</Button>
            <Button onClick={() => props.deletePost(props.mainSets.post)} >delete</Button>
        </div>
    )
}