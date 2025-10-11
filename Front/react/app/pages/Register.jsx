import "./Login/styles/Login.css"
import { useState, useEffect, useMemo, use } from "react"
import { Link, useNavigate } from "react-router-dom"
import { UserContext, AuthContext } from "../data/context.js"
import { notify_success } from "../modules/notify.js"
import { HttpMethod, Language, CacheKeys } from "../data/enums.js"
import { showLanguage, setLanguage } from "../modules/language.jsx"
import Fetch from "../API/Fetch.js"
import getToken from "../modules/getToken.js"
import ErrorMessage from "./components/ErrorMessage.jsx"
import Input from "./components/UI/Input.jsx"
import Button from "./components/UI/Button.jsx"

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
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    async function auth() {
        var token = getToken()
        var data = await Fetch({ api_version: 1, action: "auth/users/me/", method: HttpMethod.GET })

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

                var data = await Fetch({ api_version: 1, action: "auth/users/", method: HttpMethod.POST, body: registerForm, token: "" })

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
                    notify_success('Successfully registered!')
                    navigate("/login/")
                }
            } else {
                setErrors(["Error: passwords must be equal"])
            }
        } else {
            setErrors(["You must agree with User Agreement"])
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

    if (language === Language.EN) {

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
                    <select onChange={event => setLanguage(event)} className="LanguageSelect" name="language">
                        {showLanguage()}
                    </select>
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

                        3.1. This Agreement shall be governed by and interpreted in accordance with the laws of the Russian Federation.
                        <br />

                        3.2. In cases where the User is located outside the territory of the Russian Federation, the relations arising from this Agreement shall be governed by the laws of the Russian Federation, unless otherwise established by agreement of the parties.
                        <br />

                        3.3. All disputes and disagreements arising from this Agreement shall be subject to mandatory claims procedure for settlement.
                        <br />

                        3.4. The party with a claim shall send the other party a written claim indicating the nature of the claim and all necessary evidence.
                        <br />

                        3.5. The claim shall be considered within 30 (thirty) calendar days from the date of its receipt. If the dispute is not resolved in the claims procedure, it shall be considered in the court of the Russian Federation at the location of the Service, unless otherwise established by agreement of the parties.
                        <br />

                        3.6. The User shall send a claim in writing to the e-mail address: r.phil@yandex.ru.
                        <br />

                        3.7. A claim sent to the specified e-mail address shall be considered a proper method of notification and shall be considered within the time period established by this Agreement.
                        <br />

                        3.8. The User has the right to:
                        <br />

                        • Use all functions of the Service in accordance with this Agreement.
                        <br />

                        • Receive information about the operation of the Service.
                        <br />

                        • Make suggestions for improving the Service.
                        <br />

                        3.9. The User undertakes to:
                        <br />

                        • Not post materials that violate the rights of third parties, including copyright.
                        <br />

                        • Not use the Service to distribute spam, viruses or other malware.
                        <br />

                        • Do not use the Service to commit illegal acts.
                        <br />

                        • Follow the rules of communication and treat other users with respect.
                        <br />

                        All possible disputes arising from or related to this Agreement shall be resolved in accordance with the current legislation of the Russian Federation.
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

                        4.3. The Service is not responsible for payments made by individuals whose actions are deemed illegal or dishonest, or by other legal entities or individuals whose actions violate applicable law.
                        <br />

                        4.4. The Service reserves the right, at its sole discretion, without explanation or prior notice, to block or terminate access to software and services for Users or other individuals whose actions or payments raise reasonable doubts about their integrity or legality.
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

                        • Personal data: name, email address, phone number and other contact information, including Ethereum wallet address.
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
    } else if (language === Language.RU) {
        return (
            <div className="Register">
                <div className="LoginForm">
                    <h2>Добро пожаловать в phils_network!</h2>

                    {showErrors}

                    <form onSubmit={e => register(e)}>
                        <Input
                            value={registerForm.username}
                            onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })}
                            placeholder="ник"
                            type="text"
                            required
                        />
                        <br />
                        <Input
                            value={registerForm.password}
                            onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                            placeholder="пароль"
                            type="password"
                            required
                        />
                        <br />
                        <Input
                            value={registerForm.password2}
                            onChange={e => setRegisterForm({ ...registerForm, password2: e.target.value })}
                            placeholder="подтверждение пароля"
                            type="password"
                            required
                        />
                        <br />
                        <Input type="submit" value="зарегистрироваться" />
                    </form>
                    <select onChange={event => setLanguage(event)} className="LanguageSelect" name="language">
                        {showLanguage()}
                    </select>
                    <Link to="/login/" >Авторизоваться</Link>

                    <p>
                        <br />
                        <strong>Пользовательское соглашение</strong>
                        <br />
                        <br />
                        <strong>1. Общие положения</strong>
                        <br />

                        1.1. Настоящее Пользовательское соглашение (далее именуемое «Соглашение») регулирует отношения между пользователем (далее именуемым «Пользователь») и phils_network (далее именуемым «Сервис») по использованию Сервиса.
                        <br />

                        1.2. Пользуясь Сервисом, Пользователь подтверждает, что он прочитал и принимает условия настоящего Соглашения.
                        <br />

                        <strong>2. Регистрация и учетная запись</strong>
                        <br />

                        2.1. Для использования определенных функций Сервиса Пользователь должен зарегистрироваться и создать учетную запись.
                        <br />

                        2.2. Пользователь обязуется предоставить достоверную информацию при регистрации и обновлять ее в случае изменений.
                        <br />

                        2.3. Пользователь несет ответственность за сохранность своих учетных данных и не передает их третьим лицам.
                        <br />

                        <strong>3. Права и обязанности Пользователя</strong>
                        <br />

                        3.1. Настоящее Соглашение регулируется и толкуется в соответствии с законодательством Российской Федерации.
                        <br />

                        3.2. В случаях, когда Пользователь находится за пределами территории Российской Федерации, отношения, возникающие из настоящего Соглашения, регулируются законодательством Российской Федерации, если иное не установлено соглашением сторон.
                        <br />

                        3.3. Все споры и разногласия, возникающие из настоящего Соглашения, подлежат обязательному урегулированию в претензионном порядке.
                        <br />

                        3.4. Сторона, предъявившая претензию, обязана направить другой стороне письменную претензию с указанием существа претензии и приложением всех необходимых доказательств.
                        <br />

                        3.5. Претензия рассматривается в течение 30 (тридцати) календарных дней с даты ее получения. В случае неурегулирования спора в претензионном порядке он рассматривается в суде Российской Федерации по месту нахождения Сервиса, если иное не установлено соглашением сторон.
                        <br />

                        3.6. Претензия, направленная Пользователем в письменной форме на адрес электронной почты: r.phil@yandex.ru.
                        <br />

                        3.7. Претензия, направленная на указанный адрес электронной почты, считается надлежащим способом уведомления и рассматривается в сроки, установленные настоящим Соглашением.
                        <br />

                        3.8. Пользователь имеет право:
                        <br />

                        • Использовать все функции Сервиса в соответствии с настоящим Соглашением.
                        <br />

                        • Получать информацию о работе Сервиса.
                        <br />

                        • Вносить предложения по улучшению Сервиса.
                        <br />

                        3.9. Пользователь обязуется:
                        <br />

                        • Не размещать материалы, нарушающие права третьих лиц, в том числе авторские права.
                        <br />

                        • Не использовать Сервис для распространения спама, вирусов и других вредоносных программ.
                        <br />

                        • Не использовать Сервис для совершения противоправных действий.
                        <br />

                        • Соблюдать правила общения и относиться к другим пользователям с уважением.
                        <br />

                        Все возможные споры, возникающие из настоящего Соглашения или связанные с ним, разрешаются в соответствии с действующим законодательством Российской Федерации.
                        <br />

                        <strong>4. Права и обязанности Сервиса</strong>
                        <br />

                        4.1. Сервис имеет право:
                        <br />

                        • Вносить изменения в функционал и условия использования Сервиса без предварительного уведомления. <br />

                        • Ограничивать доступ к определенным функциям для отдельных пользователей.
                        <br />

                        4.2. Сервис обязуется:
                        <br />

                        • Обеспечивать защиту персональных данных Пользователей в соответствии с действующим законодательством.
                        <br />

                        • Устранять технические неполадки в разумные сроки.
                        <br />

                        4.3. Сервис не несет ответственности за платежи, совершенные лицами, чьи действия считаются незаконными или недобросовестными, а также другими юридическими или физическими лицами, чьи действия нарушают применимое законодательство.
                        <br />

                        4.4. Сервис оставляет за собой право по своему усмотрению, без объяснения причин и предварительного уведомления, блокировать или прекращать доступ к программному обеспечению и сервисам Пользователям или другим лицам, чьи действия или платежи вызывают обоснованные сомнения в их добросовестности или законности.
                        <br />

                        <strong>5. Персональные данные</strong>
                        <br />

                        5.1. При регистрации Пользователь предоставляет свои персональные данные, которые обрабатываются в соответствии с Политикой конфиденциальности Сервиса.
                        <br />

                        5.2. Пользователь дает согласие на обработку своих персональных данных в целях, связанных с использованием Сервиса.
                        <br />

                        <strong>6. Ответственность сторон</strong>
                        <br />

                        6.1. Сервис не несет ответственности за:
                        <br />

                        • Убытки, понесенные Пользователем в результате использования или невозможности использования Сервиса.
                        <br />

                        • Содержание материалов, размещаемых Пользователями.
                        <br />

                        6.2. Пользователь несет полную ответственность за свои действия при использовании Сервиса.
                        <br />

                        <strong>7. Заключительные положения</strong>
                        <br />

                        7.1. Настоящее Соглашение вступает в силу с момента его принятия Пользователем и действует до тех пор, пока Пользователь использует Сервис.
                        <br />

                        7.2. Сервис оставляет за собой право изменять условия настоящего Соглашения путем публикации новых версий на сайте.
                        <br />

                        7.3. Если какое-либо положение настоящего Соглашения будет признано недействительным, остальные положения остаются в силе.
                        <br />

                        <strong>8. Контактная информация</strong>
                        <br />

                        8.1. Все вопросы и предложения по настоящему Соглашению можно направлять на адрес электронной почты: r.phil@yandex.ru.
                    </p>
                    <br />
                    <Button id="agreeWithUserAgreementButton" onClick={() => setUserAgreementButton()} >
                        Я согласен с Пользовательским соглашением
                    </Button>

                    <p>
                        <br />
                        <strong>Политика конфиденциальности</strong>
                        <br />
                        <br />

                        <strong>1. Введение</strong>
                        <br />

                        1.1. Настоящая Политика конфиденциальности (далее именуемая «Политика») описывает, как phils_network (далее именуемый «Сервис») собирает, использует, хранит и защищает персональные данные Пользователей (далее именуемых «Пользователь»).
                        <br />

                        1.2. Используя Сервис, Пользователь подтверждает, что он ознакомился с условиями настоящей Политики и согласен с ними.
                        <br />

                        <strong>2. Собираемая информация</strong>
                        <br />

                        2.1. Мы можем собирать следующую информацию о Пользователях:
                        <br />

                        • Персональные данные: имя, адрес электронной почты, номер телефона и другая контактная информация, включая адрес Ethereum кошелька.
                        <br />

                        • Данные профиля: информация о пользователе, размещенная в профиле (фотография, биография и т. д.).
                        <br />

                        • Данные об использовании: информация о том, как Пользователь взаимодействует с Сервисом (время посещения, действия на сайте и т. д.).
                        <br />

                        • Технические данные: IP-адрес, тип устройства, операционная система и браузер.
                        <br />

                        <strong>3. Цели обработки персональных данных</strong>
                        <br />

                        3.1. Персональные данные Пользователей обрабатываются в следующих целях:
                        <br />

                        • Обеспечение работы Сервиса и его функционала.
                        <br />

                        • Улучшение качества услуг и разработка новых функций.
                        <br />

                        • Связь с Пользователями для информирования их о новостях и обновлениях.
                        <br />

                        • Проведение исследований и анализа для улучшения пользовательского опыта.
                        <br />

                        <strong>4. Хранение и защита данных</strong>
                        <br />

                        4.1. Мы принимаем все необходимые меры для защиты персональных данных Пользователей от несанкционированного доступа, изменения или раскрытия.
                        <br />

                        4.2. Персональные данные хранятся в течение срока, необходимого для достижения целей, для которых они были собраны, или в соответствии с требованиями законодательства.
                        <br />

                        <strong>5. Раскрытие информации третьим лицам</strong>
                        <br />

                        5.1. Мы не передаем персональные данные Пользователей третьим лицам без их согласия, за исключением случаев, предусмотренных законом.
                        <br />

                        5.2. Мы можем передавать информацию третьим лицам в следующих случаях:
                        <br />

                        • Для исполнения обязательств перед Пользователем.
                        <br />

                        • Когда это необходимо для защиты прав и законных интересов Сервиса или третьих лиц.
                        <br />

                        <strong>6. Права Пользователя</strong>
                        <br />

                        6.1. Пользователь имеет право:
                        <br />

                        • Запросить доступ к своим персональным данным.
                        <br />

                        • Запросить исправление неточных или неполных данных.
                        <br />

                        • Запросить удаление своих персональных данных.
                        <br />

                        • Отозвать согласие на обработку данных в любое время.
                        <br />

                        <strong>7. Изменения в Политике конфиденциальности</strong>
                        <br />

                        7.1. Мы оставляем за собой право в любое время изменять условия настоящей Политики. Все изменения будут опубликованы на сайте Сервиса.
                        <br />

                        7.2. Пользователь обязан периодически проверять Политику на предмет изменений. Продолжение использования Сервиса после внесения изменений означает согласие с новой Политикой.
                        <br />

                        <strong>8. Контактная информация</strong>
                        <br />

                        8.1. Если у Пользователя возникли вопросы или предложения по настоящей Политике, он может связаться с нами по следующему адресу: r.phil@yandex.ru.
                    </p>
                </div>
            </div>
        )
    }
}