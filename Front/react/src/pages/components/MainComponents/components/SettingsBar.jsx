import "./styles/SettingsBar.css"
import { use, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AuthContext, UserContext } from "../../../../data/context.js"
import { HttpMethod, CacheKeys, Theme, Language } from "../../../../data/enums.js"
import { ROOT_ELEMENT_THEME } from "../../../../data/constants.js"
import Fetch from "../../../../API/Fetch.js"
import Button from "../../UI/Button.jsx"

export default function SettingsBar(props) {

    var { setIsAuth } = use(AuthContext)
    var { setUser } = use(UserContext)
    var [theme, setTheme] = useState(Theme.LIGHT)
    var language = localStorage.getItem(CacheKeys.LANGUAGE)
    var navigate = useNavigate()

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
        await Fetch({ action: "api/v2/online_status/set_false/", method: HttpMethod.POST })
        await Fetch({ action: "api/v1/token/token/logout/", method: HttpMethod.POST })
        setIsAuth(false)
        localStorage.removeItem(CacheKeys.TOKEN)
        setUser({
            id: 0,
            username: "",
            email: "",
            first_name: "",
            last_name: "",
            is_online: false
        })
        navigate(`/login/`)
    }

    if (language === Language.EN) {
        return (
            <div className="SettingsBar" ref={props.setBarRef} >
                <Button onClick={() => changeTheme()} >change theme</Button>
                <br />
                <Button onClick={() => props.setModalSettings(true)} >settings</Button>
                <br />
                <Button onClick={() => logout()} >quit</Button>
            </div>
        )
    } else if (language === Language.RU) {
        return (
            <div className="SettingsBar" ref={props.setBarRef} >
                <Button onClick={() => changeTheme()} >изменить тему</Button>
                <br />
                <Button onClick={() => props.setModalSettings(true)} >настройки</Button>
                <br />
                <Button onClick={() => logout()} >выйти</Button>
            </div>
        )
    }
}