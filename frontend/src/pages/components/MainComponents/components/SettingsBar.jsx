import "./styles/SettingsBar.css"
import { useContext } from "react"
import { useSignal } from "@preact/signals-react"
import { AuthContext } from "@data/context"
import { HttpMethod, Theme } from "@data/enums"
import Fetch from "@API/Fetch"
import Button from "@pages/components/UI/Button"

export default function SettingsBar(props) {

    var { setIsAuth } = useContext(AuthContext)
    var theme = useSignal(Theme.LIGHT)
    var body = document.getElementsByTagName("body")[0]

    if (localStorage.getItem(Theme.NAME) !== null) {
        body.className = localStorage.getItem(Theme.NAME)
        theme.value = localStorage.getItem(Theme.NAME)
    } else {
        body.className = Theme.LIGHT
    }

    body.className = theme.value

    function changeTheme() {
        switch (theme.value) {
            case Theme.LIGHT:
                theme.value = Theme.DARK
                localStorage.setItem(Theme.NAME, Theme.DARK)
                break
            case Theme.DARK:
                theme.value = Theme.LIGHT
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