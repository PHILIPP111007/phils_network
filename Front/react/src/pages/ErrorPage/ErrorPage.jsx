import "./styles/ErrorPage.css"
import { CacheKeys, Language } from "../../data/enums.js"

export default function ErrorPage() {
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    if (language === Language.EN) {
        return (
            <div className="Error">
                <h2>Error</h2>
            </div>
        )
    } else if (language === Language.RU) {
        return (
            <div className="Error">
                <h2>Ошибка</h2>
            </div>
        )
    }
}