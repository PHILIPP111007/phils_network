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
        await Fetch({ action: "api/auth/users/me/", method: "GET" })
            .then((data) => {
                if (data.username) {
                    setUser({ ...user, ...data })
                    setIsAuth(true)
                    navigate(`/user/${data.username}/`)
                }
            })
    }

    async function login(event) {
        event.preventDefault()
        await Fetch({ action: "auth/token/login/", method: "POST", body: loginForm })
            .then((data) => {
                if (data.auth_token) {
                    setIsAuth(true)
                    localStorage.setItem("token", data.auth_token)
                    auth()
                }
            })
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