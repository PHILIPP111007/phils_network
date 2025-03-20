import "./styles/SuspenseLoading.css"
import { CacheKeys, Language } from "../../data/enums"

export default function SuspenseLoading() {
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    if (language === Language.EN) {
        return (
            <div className="SuspenseLoading">
                <h3>Please wait...</h3>
            </div>
        )
    } else if (language === Language.RU) {
        return (
            <div className="SuspenseLoading">
                <h3>Пожалуйста, подождите...</h3>
            </div>
        )
    }
}