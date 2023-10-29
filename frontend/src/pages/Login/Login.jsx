import "./styles/Login.css"
import { useState, useContext, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { AuthContext, UserContext } from "../../data/context"
import Fetch from "../../API/Fetch"
import Input from "../components/UI/Input"

export default function Login() {

    const { setIsAuth } = useContext(AuthContext)
    const { user, setUser } = useContext(UserContext)
    const [loginForm, setLoginForm] = useState({ username: "", password: "" })
    const navigate = useNavigate()

    async function auth() {
        const token = localStorage.getItem("token")
        const data = await Fetch({ action: "api/auth/users/me/", method: "GET", token: token })

        if (data && !data.detail && data.username) {
            setUser({ ...user, ...data })
            setIsAuth(true)

            let path
            if (localStorage.getItem("path") !== null) {
                path = `${localStorage.getItem("path")}${data.username}`
            } else {
                path = `/user/${data.username}`
            }
            navigate(path)
        }
    }

    async function login(event) {
        event.preventDefault()
        const data = await Fetch({ action: "auth/token/login/", method: "POST", body: loginForm, token: "" })

        if (data && !data.detail && data.auth_token) {
            localStorage.setItem("token", data.auth_token)
            setIsAuth(true)
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
                    />
                    <br />
                    <Input
                        value={loginForm.password}
                        onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                        placeholder="password"
                        type="password"
                    />
                    <br />
                    <Input type="submit" value="log in" />
                </form>
                <Link to="/register/" >Register</Link>
            </div>
        </div>
    )
}