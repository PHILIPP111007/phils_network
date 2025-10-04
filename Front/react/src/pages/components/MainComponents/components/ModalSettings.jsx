import "./styles/ModalSettings.css"
import { use, useEffect, useState } from "react"
import Form from "react-bootstrap/Form"
import { UserContext } from "../../../../data/context.js"
import { HttpMethod, CacheKeys, Language } from "../../../../data/enums.js"
import Fetch from "../../../../API/Fetch.js"
import Input from "../../UI/Input.jsx"
import Button from "../../UI/Button.jsx"

export default function ModalSettings(props) {

    var { user, setUser } = use(UserContext)
    var [userNew, setUserNew] = useState({ first_name: "", last_name: "", email: "" , ethereum_address: "", infura_api_key: "", image: null})
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    async function userUpdate(event) {
        event.preventDefault()
        if (userNew.first_name || userNew.last_name || userNew.email || userNew.image) {

            var formData = new FormData()
            formData.append('id', userNew.id)
            formData.append('first_name', userNew.first_name)
            formData.append('last_name', userNew.last_name)
            formData.append('email', userNew.email)
            formData.append('ethereum_address', userNew.ethereum_address)
            formData.append('infura_api_key', userNew.infura_api_key)
            formData.append('image', userNew.image)

            var data = await Fetch({ action: "api/v2/user/", method: HttpMethod.PUT, body: formData, is_uploading_file: true })
            if (data.ok) {
                setUser(data.user)
            }
        }
    }

    useEffect(() => {
        setUserNew({ ...user })
    }, [user])

    if (language === Language.EN) {
        return (
            <div className="ModalSettings">
                <h2>Settings</h2>

                <label>Change personal info</label>
                <Form>
                    <Form.Control
                        type="text"
                        placeholder="first name"
                        value={userNew.first_name}
                        onChange={(e) => setUserNew({ ...userNew, first_name: e.target.value })}
                    />
                    <br />
                    <Form.Control
                        type="text"
                        placeholder="last name"
                        value={userNew.last_name}
                        onChange={(e) => setUserNew({ ...userNew, last_name: e.target.value })}
                    />
                    <br />
                    <Form.Control
                        type="email"
                        placeholder="email"
                        value={userNew.email}
                        onChange={(e) => setUserNew({ ...userNew, email: e.target.value })}
                    />
                    <br />
                    <Form.Control
                        type="text"
                        placeholder="ethereum address"
                        value={userNew.ethereum_address}
                        onChange={(e) => setUserNew({ ...userNew, ethereum_address: e.target.value })}
                    />
                    <br />
                    <Form.Control
                        type="text"
                        placeholder="infura api key"
                        value={userNew.infura_api_key}
                        onChange={(e) => setUserNew({ ...userNew, infura_api_key: e.target.value })}
                    />
                    <br />
                    <Button onClick={(e) => userUpdate(e)} >upload</Button>
                    <br />
                    <br />
                    <Form.Control
                        type="reset"
                        value="reset"
                        onClick={() => setUserNew({ ...user })}
                    />
                </Form>
                <br />
                <form onChange={e => setUserNew({ ...userNew, image: e.target.files[0] })} className="uploadFileForm">
                    <Input id="formFile" type="file" />
                </form>
                <br />

                <br />
                <label>Danger zone</label>
                <br />
                <Button onClick={() => {
                    props.setModalSettings(false)
                    props.setModalDelAcc(true)
                }} variant="danger" >
                    delete account
                </Button>
            </div>
        )
    } else if (language === Language.RU) {
        return (
            <div className="ModalSettings">
                <h2>Настройки</h2>

                <label>Изменить личную информацию</label>
                <Form>
                    <Form.Control
                        type="text"
                        placeholder="имя"
                        value={userNew.first_name}
                        onChange={(e) => setUserNew({ ...userNew, first_name: e.target.value })}
                    />
                    <br />
                    <Form.Control
                        type="text"
                        placeholder="фамилия"
                        value={userNew.last_name}
                        onChange={(e) => setUserNew({ ...userNew, last_name: e.target.value })}
                    />
                    <br />
                    <Form.Control
                        type="email"
                        placeholder="email"
                        value={userNew.email}
                        onChange={(e) => setUserNew({ ...userNew, email: e.target.value })}
                    />
                    <br />
                    <Form.Control
                        type="text"
                        placeholder="ethereum адресс"
                        value={userNew.ethereum_address}
                        onChange={(e) => setUserNew({ ...userNew, ethereum_address: e.target.value })}
                    />
                    <br />
                    <Form.Control
                        type="text"
                        placeholder="infura api ключ"
                        value={userNew.infura_api_key}
                        onChange={(e) => setUserNew({ ...userNew, infura_api_key: e.target.value })}
                    />
                    <br />
                    <Button onClick={(e) => userUpdate(e)} >обновить</Button>
                    <Form.Control
                        type="reset"
                        value="reset"
                        onClick={() => setUserNew({ ...user })}
                    />
                    <br />
                </Form>

                <br />
                <label>Опасная зона</label>
                <br />
                <Button onClick={() => {
                    props.setModalSettings(false)
                    props.setModalDelAcc(true)
                }} variant="danger" >
                    удалить аккаунт
                </Button>
            </div>
        )
    }
}