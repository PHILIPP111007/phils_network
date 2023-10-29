import "./styles/ScrollToTopOrBottom.css"
import Button from "../../UI/Button"

export default function ScrollToTopOrBottom({ bottom }) {

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

    return (
        <div id="srollToTopBtn">
            <Button onClick={() => myScroll()} >{bottom ? "To bottom" : "To top"}</Button>
        </div>
    )
}