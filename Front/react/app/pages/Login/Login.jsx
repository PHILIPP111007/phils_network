import "./styles/Login.css"
import { useState, use, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { AuthContext, UserContext } from "../../data/context.js"
import { notify_success } from "../../modules/notify.js"
import { HttpMethod, CacheKeys, Language, APIVersion } from "../../data/enums.js"
import { showLanguage, setLanguage } from "../../modules/language.jsx"
import getToken from "../../modules/getToken.js"
import Fetch from "../../API/Fetch.js"
import Input from "../components/UI/Input.jsx"

export default function Login() {

    var { setIsAuth } = use(AuthContext)
    var { user, setUser } = use(UserContext)
    var [loginForm, setLoginForm] = useState({ username: "", password: "" })
    var navigate = useNavigate()
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    async function auth() {
        var token = getToken()
        var data = await Fetch({ api_version: APIVersion.V1, action: "auth/users/me/", method: HttpMethod.GET })

        if (data && !data.detail && data.username && token) {
            setUser({ ...user, ...data })
            setIsAuth(true)

            var path = localStorage.getItem(CacheKeys.REMEMBER_PAGE)
            if (path !== null) {
                path = `/${path}/`
            } else {
                path = `/users/${data.username}/`
            }
            navigate(path)
        }
    }

    async function login(event) {
        event.preventDefault()
        var data = await Fetch({ api_version: APIVersion.V1, action: "token/login/", method: HttpMethod.POST, body: loginForm, token: "" })
        await Fetch({ api_version: APIVersion.V2, action: "set-session-cookie/", method: HttpMethod.POST })

        if (data && !data.detail && data.auth_token) {
            localStorage.setItem(CacheKeys.TOKEN, data.auth_token)
            setIsAuth(true)

            setUser({ ...user, password: loginForm.password })

            if (language === Language.EN) {
                notify_success('Successfully login!')
            } else if (language === Language.RU) {
                notify_success('Вы успешно вошли!')
            }

            await Fetch({ api_version: APIVersion.V2, action: "online_status/set_true/", method: HttpMethod.POST })

            auth()
        }
    }

    useEffect(() => {
        auth()
    }, [])

    if (language === Language.EN) {
        return (
            <div className="Login">
                <div className="LoginForm">
                    <h2>Welcome to phils_network!</h2>
                    <form id="LoginForm" onSubmit={e => login(e)}>
                        <Input
                            value={loginForm.username}
                            onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                            placeholder="username"
                            type="text"
                            required
                        />
                        <br />
                        <Input
                            value={loginForm.password}
                            onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                            placeholder="password"
                            type="password"
                            required
                        />
                        <br />
                        <Input type="submit" value="log in" />
                    </form>
                    <select onChange={event => setLanguage(event)} className="LanguageSelect" name="language">
                        {showLanguage()}
                    </select>
                    <Link to="/register/" >Register</Link>
                </div>
            </div>
        )
    } else if (language === Language.RU) {
        return (
            <div className="Login">
                <div className="LoginForm">
                    <h2>Добро пожаловать в phils_network!</h2>
                    <form id="LoginForm" onSubmit={e => login(e)}>
                        <Input
                            value={loginForm.username}
                            onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                            placeholder="ник"
                            type="text"
                            required
                        />
                        <br />
                        <Input
                            value={loginForm.password}
                            onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                            placeholder="пароль"
                            type="password"
                            required
                        />
                        <br />
                        <Input type="submit" value="Авторизоваться" />
                    </form>
                    <select onChange={event => setLanguage(event)} className="LanguageSelect" name="language">
                        {showLanguage()}
                    </select>
                    <Link to="/register/" >Зарегистрироваться</Link>
                </div>
            </div>
        )
    }
}