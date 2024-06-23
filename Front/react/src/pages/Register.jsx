import "./Login/styles/Login.css"
import { useState, useContext, useEffect, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { UserContext, AuthContext } from "@data/context"
import { HttpMethod } from "@data/enums"
import Fetch from "@API/Fetch"
import getToken from "@modules/getToken"
import ErrorMessage from "@pages/components/ErrorMessage"
import Input from "@pages/components/UI/Input"

export default function Register() {

    var { setIsAuth } = useContext(AuthContext)
    var { user, setUser } = useContext(UserContext)
    var [registerForm, setRegisterForm] = useState({
        username: "",
        password: "",
        password2: ""
    })
    var [errors, setErrors] = useState([])
    var navigate = useNavigate()

    async function auth() {
        var token = getToken()
        var data = await Fetch({ action: "auth/users/me/", method: HttpMethod.GET, token: token })

        if (data && !data.detail && data.username) {
            setUser({ ...user, ...data })
            setIsAuth(true)
            navigate(`/users/${data.username}/`)
        }
    }

    useEffect(() => {
        auth()
    }, [])

    async function register(event) {
        event.preventDefault()

        if (registerForm.password === registerForm.password2) {
            var data = await Fetch({ action: "auth/users/", method: HttpMethod.POST, body: registerForm, token: "" })

            var new_errors = []
            if (data.username) {
                for (let i = 0; i < data.username.length; i++) {
                    new_errors.push("Error: " + data.username[i])
                }
            }
            if (data.password) {
                for (let i = 0; i < data.password.length; i++) {
                    new_errors.push("Error: " + data.password[i])
                }
            }
            if (new_errors.length > 0) {
                setErrors((prev) => new_errors)
            }

            if (typeof data.username === "string") {
                setUser(data)
                navigate("/login/")
            }
        } else {
            setErrors(['Error: passwords must be equal'])
        }
    }

    var showErrors = useMemo(() => {
        return (
            <>
                {errors.map((error) =>
                    <>
                        <ErrorMessage errorMessage={error} />
                        <br />
                    </>

                )}
            </>
        )
    }, [errors])

    return (
        <div className="Register">
            <div className="LoginForm">
                <h2>Welcome to phils_network!</h2>

                {showErrors}

                <form onSubmit={e => register(e)}>
                    <Input
                        value={registerForm.username}
                        onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })}
                        placeholder="username"
                        type="text"
                        required
                    />
                    <br />
                    <Input
                        value={registerForm.password}
                        onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                        placeholder="password"
                        type="password"
                        required
                    />
                    <br />
                    <Input
                        value={registerForm.password2}
                        onChange={e => setRegisterForm({ ...registerForm, password2: e.target.value })}
                        placeholder="password confirmation"
                        type="password"
                        required
                    />
                    <br />
                    <Input type="submit" value="register" />
                </form>
                <Link to="/login/" >Log in</Link>
            </div>
        </div>
    )
}