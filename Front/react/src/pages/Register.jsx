import "./Login/styles/Login.css"
import { useState, useEffect, useMemo, use } from "react"
import { Link, useNavigate } from "react-router-dom"
import { UserContext, AuthContext } from "../data/context"
import { HttpMethod } from "../data/enums"
import Fetch from "../API/Fetch"
import getToken from "../modules/getToken"
import ErrorMessage from "./components/ErrorMessage"
import Input from "./components/UI/Input"
import Button from "./components/UI/Button"

export default function Register() {

    var { setIsAuth } = use(AuthContext)
    var { user, setUser } = use(UserContext)
    var [registerForm, setRegisterForm] = useState({
        username: "",
        password: "",
        password2: ""
    })
    var [userAgreement, setUserAgreement] = useState(false)
    var [errors, setErrors] = useState([])
    var navigate = useNavigate()

    async function auth() {
        var token = getToken()
        var data = await Fetch({ action: "api/v1/auth/users/me/", method: HttpMethod.GET })

        if (data && !data.detail && data.username && token) {
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

        if (userAgreement) {
            if (registerForm.password === registerForm.password2) {
                setErrors([])

                var data = await Fetch({ action: "api/v1/auth/users/", method: HttpMethod.POST, body: registerForm, token: "" })

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

                    setUser({ ...data })

                    navigate("/login/")
                }
            } else {
                setErrors(['Error: passwords must be equal'])
            }
        } else {
            setErrors(['You must agree with User Agreement'])
        }
    }

    function setUserAgreementButton() {
        setUserAgreement(true)
        var button = document.getElementById("agreeWithUserAgreementButton")
        button.style.backgroundColor = "rgb(87, 195, 87)"
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

                <p>
                    <br />
                    <strong>User Agreement</strong>
                    <br />
                    <br />
                    <strong>1. General Provisions</strong>
                    <br />

                    1.1. This User Agreement (hereinafter referred to as the "Agreement") governs the relationship between the user (hereinafter referred to as the "User") and phils_network (hereinafter referred to as the "Service") regarding the use of the Service.
                    <br />

                    1.2. By using the Service, the User confirms that he/she has read and accepts the terms of this Agreement.
                    <br />

                    <strong>2. Registration and Account</strong>
                    <br />

                    2.1. To use certain functions of the Service, the User must register and create an account.
                    <br />

                    2.2. The User undertakes to provide accurate information upon registration and update it in case of changes.
                    <br />

                    2.3. The User is responsible for the safety of his/her account data and not to transfer it to third parties.
                    <br />

                    <strong>3. User Rights and Obligations</strong>
                    <br />

                    3.1. The User has the right to:
                    <br />

                    • Use all functions of the Service in accordance with this Agreement.
                    <br />

                    • Receive information about the operation of the Service.
                    <br />

                    • Make suggestions for improving the Service.
                    <br />

                    3.2. The User undertakes to:
                    <br />

                    • Not post materials that violate the rights of third parties, including copyright.
                    <br />

                    • Not use the Service to distribute spam, viruses or other malware.
                    <br />

                    • Follow the rules of communication and treat other users with respect.
                    <br />

                    <strong>4. Service Rights and Obligations</strong>
                    <br />

                    4.1. The Service has the right to:
                    <br />

                    • Make changes to the functionality and terms of use of the Service without prior notice. <br />

                    • Restrict access to certain functions for individual users.
                    <br />

                    4.2. The Service undertakes to:
                    <br />

                    • Ensure the protection of Users' personal data in accordance with applicable law.
                    <br />

                    • Eliminate technical malfunctions within a reasonable time.
                    <br />

                    <strong>5. Personal data</strong>
                    <br />

                    5.1. When registering, the User provides their personal data, which is processed in accordance with the Service's Privacy Policy.
                    <br />

                    5.2. The User agrees to the processing of their personal data for purposes related to the use of the Service.
                    <br />

                    <strong>6. Liability of the parties</strong>
                    <br />

                    6.1. The Service shall not be liable for:
                    <br />

                    • Losses incurred by the User as a result of the use or inability to use the Service.
                    <br />

                    • Content of materials posted by Users.
                    <br />

                    6.2. The User is fully responsible for their actions when using the Service.
                    <br />

                    <strong>7. Final Provisions</strong>
                    <br />

                    7.1. This Agreement shall enter into force upon its acceptance by the User and shall remain in effect as long as the User uses the Service.
                    <br />

                    7.2. The Service reserves the right to change the terms of this Agreement by publishing new versions on the website.
                    <br />

                    7.3. If any provision of this Agreement is deemed invalid, the remaining provisions shall remain in force.
                    <br />

                    <strong>8. Contact Information</strong>
                    <br />

                    8.1. All questions and suggestions regarding this Agreement can be sent to the email address: r.phil@yandex.ru.
                </p>
                <br />
                <Button id="agreeWithUserAgreementButton" onClick={() => setUserAgreementButton()} >
                    I agree with User Agreement
                </Button>

                <p>
                    <br />
                    <strong>Privacy Policy</strong>
                    <br />
                    <br />

                    <strong>1. Introduction</strong>
                    <br />

                    1.1. This Privacy Policy (hereinafter referred to as the “Policy”) describes how phils_network (hereinafter referred to as the “Service”) collects, uses, stores and protects the personal data of Users (hereinafter referred to as the “User”).
                    <br />

                    1.2. By using the Service, the User confirms that they have read the terms of this Policy and agree with it.
                    <br />

                    <strong>2. Collected information</strong>
                    <br />

                    2.1. We may collect the following information about Users:
                    <br />

                    • Personal data: name, email address, phone number and other contact information.
                    <br />

                    • Profile data: information about the user posted in the profile (photo, biography, etc.).
                    <br />

                    • Usage data: information about how the User interacts with the Service (time of visit, actions on the site, etc.).
                    <br />

                    • Technical data: IP address, device type, operating system and browser.
                    <br />

                    <strong>3. Purposes of personal data processing</strong>
                    <br />

                    3.1. Users' personal data is processed for the following purposes:
                    <br />

                    • Ensuring the operation of the Service and its functionality.
                    <br />

                    • Improving the quality of services and developing new functions.
                    <br />

                    • Contacting Users to inform them of news and updates.
                    <br />

                    • Conducting research and analysis to improve the user experience.
                    <br />

                    <strong>4. Data storage and protection</strong>
                    <br />

                    4.1. We take all necessary measures to protect Users' personal data from unauthorized access, modification or disclosure.
                    <br />

                    4.2. Personal data is stored for the time necessary to achieve the purposes for which it was collected, or in accordance with legal requirements.
                    <br />

                    <strong>5. Disclosure of information to third parties</strong>
                    <br />

                    5.1. We do not transfer Users' personal data to third parties without their consent, except in cases provided by law.
                    <br />

                    5.2. We may transfer information to third parties in the following cases:
                    <br />

                    • To fulfill obligations to the User.
                    <br />

                    • When necessary to protect the rights and legitimate interests of the Service or third parties.
                    <br />

                    <strong>6. User Rights</strong>
                    <br />

                    6.1. The User has the right to:
                    <br />

                    • Request access to their personal data.
                    <br />

                    • Request correction of inaccurate or incomplete data.
                    <br />

                    • Request deletion of their personal data.
                    <br />

                    • Revoke consent to data processing at any time.
                    <br />

                    <strong>7. Changes to the Privacy Policy</strong>
                    <br />

                    7.1. We reserve the right to change the terms of this Policy at any time. All changes will be published on the Service website.
                    <br />

                    7.2. The User is obliged to periodically check the Policy for changes. Continued use of the Service after changes have been made means consent to the new Policy.
                    <br />

                    <strong>8. Contact Information</strong>
                    <br />

                    8.1. If the User has questions or suggestions regarding this Policy, they can contact us at the following address: r.phil@yandex.ru.
                </p>
            </div>
        </div>
    )
}