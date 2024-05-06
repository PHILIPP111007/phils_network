import "./styles/SettingsBar.css"
import { useContext, useState, useEffect } from "react"
import { AuthContext } from "@data/context"
import { HttpMethod, CacheKeys, Theme } from "@data/enums"
import { ROOT_ELEMENT_THEME } from "@data/constants"
import Fetch from "@API/Fetch"
import Button from "@pages/components/UI/Button"

export default function SettingsBar(props) {

    var { setIsAuth } = useContext(AuthContext)
    var [theme, setTheme] = useState(Theme.LIGHT)

    useEffect(() => {
        if (localStorage.getItem(CacheKeys.THEME) !== null) {
            setTheme(localStorage.getItem(CacheKeys.THEME))
        }
        ROOT_ELEMENT_THEME.className = theme
    }, [theme])

    function changeTheme() {
        switch (theme) {
            case Theme.LIGHT:
                setTheme(Theme.DARK)
                localStorage.setItem(CacheKeys.THEME, Theme.DARK)
                break
            case Theme.DARK:
                setTheme(Theme.LIGHT)
                localStorage.setItem(CacheKeys.THEME, Theme.LIGHT)
                break
            default:
                break
        }
    }

    async function logout() {
        await Fetch({ action: "token/token/logout/", method: HttpMethod.POST })
            .then(() => {
                localStorage.clear()
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