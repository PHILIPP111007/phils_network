import "./styles/ModalPostEdit.css"
import Button from "@pages/components/UI/Button"

export default function ModalPostEdit(props) {
    return (
        <div className="ModalPostEdit">
            <textarea
                value={props.mainSets.post.content}
                maxLength="5000"
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