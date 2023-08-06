import "./styles/ModalPostEdit.css"
import Button from "../../../components/UI/Button"

export default function ModalPostCreate(props) {
    return (
        <div className="ModalPostEdit">
            <div>
                <textarea
                    value={props.mainSets.text}
                    maxLength="5000"
                    onChange={(e) => props.setMainSets({
                        ...props.mainSets,
                        text: e.target.value
                    })
                    }
                />
            </div>
            <Button onClick={() => props.createPost(props.mainSets.text)} >create</Button>
        </div>
    )
}