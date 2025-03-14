import "./styles/Login.css"
import { useState, use, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { AuthContext, UserContext } from "../../data/context"
import { HttpMethod, CacheKeys } from "../../data/enums"
import getToken from "../../modules/getToken"
import Fetch from "../../API/Fetch"
import Input from "../components/UI/Input"

export default function Login() {

    var { setIsAuth } = use(AuthContext)
    var { user, setUser } = use(UserContext)
    var [loginForm, setLoginForm] = useState({ username: "", password: "" })
    var navigate = useNavigate()

    async function auth() {
        var token = getToken()
        var data = await Fetch({ action: "api/v1/auth/users/me/", method: HttpMethod.GET })

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
        var data = await Fetch({ action: "api/v1/token/token/login/", method: HttpMethod.POST, body: loginForm, token: "" })

        if (data && !data.detail && data.auth_token) {
            localStorage.setItem(CacheKeys.TOKEN, data.auth_token)
            setIsAuth(true)

            // Create online status
            data = await Fetch({ action: "api/v2/online_status/", method: HttpMethod.POST })

            auth()
        }
    }

    useEffect(() => {
        auth()
    }, [])

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
                <Link to="/register/" >Register</Link>
            </div>
        </div>
    )
}