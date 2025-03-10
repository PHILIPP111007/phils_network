import "./styles/ModalPostEdit.css"
import { useState } from "react"
import Button from "../../components/UI/Button"

export default function ModalPostCreate(props) {

    var [text, setText] = useState("")

    return (
        <div className="ModalPostEdit">
            <textarea
                value={text}
                maxLength="5000"
                placeholder="Use markdown to format your text..."
                onChange={(e) => setText(e.target.value)}
            />
            <Button onClick={() => {
                props.createPost(text)
                setText("")
            }} >create</Button>
        </div>
    )
}