import "./styles/ModalPostEdit.css"
import { useState } from "react"
import { CacheKeys, Language } from "../../../data/enums.js"
import Button from "../../components/UI/Button.jsx"

export default function ModalPostCreate(props) {
    var [text, setText] = useState("")
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    if (language === Language.EN) {
        return (
            <div className="ModalPostEdit">
                <textarea
                    value={text}
                    class="form-control"
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
    } else if (language === Language.RU) {
        return (
            <div className="ModalPostEdit">
                <textarea
                    value={text}
                    class="form-control"
                    maxLength="5000"
                    placeholder="Используйте Markdown для форматирования текста..."
                    onChange={(e) => setText(e.target.value)}
                />
                <Button onClick={() => {
                    props.createPost(text)
                    setText("")
                }} >Создать</Button>
            </div>
        )
    }
}