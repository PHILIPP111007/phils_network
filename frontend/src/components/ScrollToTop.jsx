import '../styles/ScrollToTop.css'
import Button from "./UI/Button"

export default function ScrollToTop() {

    function myScroll() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    return (
        <div id='srollToTopBtn'>
            <Button onClick={myScroll} >To top</Button>
        </div>
    )
}