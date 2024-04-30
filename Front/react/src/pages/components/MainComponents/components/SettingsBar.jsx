import "./styles/SettingsBar.css"
import { useContext, useState, useEffect } from "react"
import { AuthContext } from "@data/context"
import { HttpMethod, Theme } from "@data/enums"
import Fetch from "@API/Fetch"
import Button from "@pages/components/UI/Button"

export default function SettingsBar(props) {

    var { setIsAuth } = useContext(AuthContext)
    var [theme, setTheme] = useState(Theme.LIGHT)
    var body = document.getElementsByTagName("body")[0]

    useEffect(() => {
        if (localStorage.getItem(Theme.NAME) !== null) {
            setTheme(localStorage.getItem(Theme.NAME))
        }
        body.className = theme
    }, [theme])

    function changeTheme() {
        switch (theme) {
            case Theme.LIGHT:
                setTheme(Theme.DARK)
                localStorage.setItem(Theme.NAME, Theme.DARK)
                break
            case Theme.DARK:
                setTheme(Theme.LIGHT)
                localStorage.setItem(Theme.NAME, Theme.LIGHT)
                break
            default:
                break
        }
    }

    async function logout() {
        await Fetch({ action: "auth/token/logout/", method: HttpMethod.POST })
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