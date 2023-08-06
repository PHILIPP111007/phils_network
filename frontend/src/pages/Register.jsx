import "./Login/styles/Login.css"
import { useState, useContext, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { UserContext, AuthContext } from "../data/context"
import Fetch from "../API/Fetch"
import Input from "./components/UI/Input"

export default function Register() {

    const { setIsAuth } = useContext(AuthContext)
    const { user, setUser } = useContext(UserContext)
    const navigate = useNavigate()
    const [registerForm, setRegisterForm] = useState({
        username: "",
        password: "",
        password2: ""
    })

    async function auth() {
        const token = localStorage.getItem("token")
        if (token) {

            await Fetch({ action: "api/auth/users/me/", method: "GET", token: token })
                .then((data) => {
                    if (data.username) {
                        setUser({ ...user, ...data })
                        setIsAuth(true)
                        navigate(`/user/${data.username}/`)
                    }
                })
        }
    }

    useEffect(() => {
        auth()
    }, [])

    async function register(event) {
        event.preventDefault()

        if (registerForm.password === registerForm.password2) {
            await Fetch({ action: "api/auth/users/", method: "POST", body: registerForm })
                .then((data) => {
                    if (typeof data.username === "string") {
                        setUser(data)
                        navigate("/login/")
                    }
                })
        }
    }

    return (
        <div className="Register">
            <div className="LoginForm">
                <h2>Welcome to phils_network!</h2>
                <form onSubmit={e => register(e)}>
                    <Input
                        value={registerForm.username}
                        onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })}
                        placeholder="username"
                        type="text"
                    />
                    <br />
                    <Input
                        value={registerForm.password}
                        onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                        placeholder="password"
                        type="text"
                    />
                    <br />
                    <Input
                        value={registerForm.password2}
                        onChange={e => setRegisterForm({ ...registerForm, password2: e.target.value })}
                        placeholder="password confirmation"
                        type="text"
                    />
                    <br />

                    <Input type="submit" value="register" />
                </form>
                <Link to="/login/" >Log in</Link>
            </div>
        </div>
    )
}