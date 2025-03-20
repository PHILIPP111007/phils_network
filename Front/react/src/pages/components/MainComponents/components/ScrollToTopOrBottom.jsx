import "./styles/ScrollToTopOrBottom.css"
import { CacheKeys, Language } from "../../../../data/enums"
import Button from "../../UI/Button"

export default function ScrollToTopOrBottom({ bottom }) {
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    function myScroll() {
        if (bottom) {
            window.scrollTo({
                top: document.body.scrollHeight,
                // behavior: "smooth"
            })
        } else {
            window.scrollTo({
                top: 0
            })
        }
    }

    if (language === Language.EN) {
        return (
            <div id="srollToTopBtn">
                <Button onClick={() => myScroll()} >{bottom ? "bottom" : "top"}</Button>
            </div>
        )
    } else if (language === Language.RU) {
        return (
            <div id="srollToTopBtn">
                <Button onClick={() => myScroll()} >{bottom ? "вниз" : "наверх"}</Button>
            </div>
        )
    }
}