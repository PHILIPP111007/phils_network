export default function showHideBar(setBarRef) {
    if (!setBarRef.current.style.top || setBarRef.current.style.top === "-200px") {
        setTimeout(() => { setBarRef.current.style.top = "60px" }, 50)
    } else if (setBarRef.current.style.top === "60px") {
        setTimeout(() => { setBarRef.current.style.top = "-200px" }, 50)
    }
}