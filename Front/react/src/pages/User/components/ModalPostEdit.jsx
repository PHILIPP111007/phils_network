import "./styles/ModalPostEdit.css"
import { CacheKeys, Language } from "../../../data/enums.js"
import Button from "../../components/UI/Button.jsx"

export default function ModalPostEdit(props) {
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    if (language === Language.EN) {
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
    } else if (language === Language.RU) {
        return (
            <div className="ModalPostEdit">
                <textarea
                    value={props.mainSets.post.content}
                    maxLength="5000"
                    placeholder="Используйте Markdown для форматирования текста..."
                    onChange={(e) => props.setMainSets({
                        ...props.mainSets,
                        post: { ...props.mainSets.post, content: e.target.value }
                    })}
                />
                <Button onClick={() => props.editPost(props.mainSets.post)} >Редактировать</Button>
                <Button onClick={() => props.deletePost(props.mainSets.post)} >Удалить</Button>
            </div>
        )
    }
}