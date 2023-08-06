import "./styles/SettingsBar.css"
import { useContext } from "react"
import { AuthContext, ThemeContext } from "../../../../data/context"
import Fetch from "../../../../API/Fetch"
import Button from "../../UI/Button"

export default function SettingsBar(props) {

    const { setIsAuth } = useContext(AuthContext)
    const { theme, setTheme } = useContext(ThemeContext)
    const token = localStorage.getItem("token")

    function changeTheme() {
        if (theme === "light") {
            setTheme("dark")
            localStorage.setItem("theme", "dark")
        } else if (theme === "dark") {
            setTheme("light")
            localStorage.setItem("theme", "light")
        }
    }

    async function logout() {
        await Fetch({ action: "auth/token/logout/", method: "POST", token: token })
            .then(() => {
                localStorage.removeItem("token")
                setIsAuth(false)
            })
    }

    return (
        <div className="SettingsBar" ref={props.setBarRef} >
            <Button onClick={() => changeTheme()} >change theme</Button>
            <br />
            <Button onClick={() => props.setModalSettings(true)} >settings</Button>
            <br />
            <Button onClick={() => logout()} >quit</Button>
        </div>
    )
}