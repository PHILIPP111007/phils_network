import "./styles/Loading.css"
import { CacheKeys, Language } from "../../data/enums.js"

export default function Loading() {
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    if (language === Language.EN) {
        return (
            <div className="Loading">
                <h4>loading...</h4>
            </div>
        )
    } else if (language === Language.RU) {
        return (
            <div className="Loading">
                <h4>загрузка...</h4>
            </div>
        )
    }
}