import "./styles/SuspenseLoading.css"
import Spinner from "react-bootstrap/Spinner"
import { CacheKeys, Language } from "../../data/enums.js"

export default function SuspenseLoading() {
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    if (language === Language.EN) {
        return (
            <div className="SuspenseLoading d-flex align-items-center justify-content-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        )
    } else if (language === Language.RU) {
        return (
            <div className="SuspenseLoading d-flex align-items-center justify-content-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Загрузка...</span>
                </Spinner>
            </div>
        )
    }
}