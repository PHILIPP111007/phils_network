import "./styles/ModalSettings.css"
import { use, useEffect, useState } from "react"
import { UserContext } from "../../../../data/context.js"
import { HttpMethod, CacheKeys, Language } from "../../../../data/enums.js"
import Fetch from "../../../../API/Fetch.js"
import Button from "../../UI/Button.jsx"
import Input from "../../UI/Input.jsx"

export default function ModalSettings(props) {

    var { user, setUser } = use(UserContext)
    var [userNew, setUserNew] = useState({ first_name: "", last_name: "", email: "" , ethereum_address: "", infura_api_key: ""})
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    async function userUpdate(event) {
        event.preventDefault()
        if (userNew.first_name || userNew.last_name || userNew.email) {
            var data = await Fetch({ action: `api/v2/user/`, method: HttpMethod.PUT, body: userNew })
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
                <form>
                    <Input
                        type="text"
                        className="form-control"
                        placeholder="first name"
                        value={userNew.first_name}
                        onChange={(e) => setUserNew({ ...userNew, first_name: e.target.value })}
                    />
                    <br />
                    <Input
                        type="text"
                        className="form-control"
                        placeholder="last name"
                        value={userNew.last_name}
                        onChange={(e) => setUserNew({ ...userNew, last_name: e.target.value })}
                    />
                    <br />
                    <Input
                        type="email"
                        className="form-control"
                        placeholder="email"
                        value={userNew.email}
                        onChange={(e) => setUserNew({ ...userNew, email: e.target.value })}
                    />
                    <br />
                    <Input
                        type="text"
                        className="form-control"
                        placeholder="ethereum address"
                        value={userNew.ethereum_address}
                        onChange={(e) => setUserNew({ ...userNew, ethereum_address: e.target.value })}
                    />
                    <br />
                    <Input
                        type="text"
                        className="form-control"
                        placeholder="infura api key"
                        value={userNew.infura_api_key}
                        onChange={(e) => setUserNew({ ...userNew, infura_api_key: e.target.value })}
                    />
                    <br />
                    <Button onClick={(e) => userUpdate(e)} >upload</Button>
                    <Input
                        type="reset"
                        className="form-control"
                        value="reset"
                        onClick={() => setUserNew({ ...user })}
                    />
                </form>

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
                <form>
                    <Input
                        type="text"
                        className="form-control"
                        placeholder="имя"
                        value={userNew.first_name}
                        onChange={(e) => setUserNew({ ...userNew, first_name: e.target.value })}
                    />
                    <br />
                    <Input
                        type="text"
                        className="form-control"
                        placeholder="фамилия"
                        value={userNew.last_name}
                        onChange={(e) => setUserNew({ ...userNew, last_name: e.target.value })}
                    />
                    <br />
                    <Input
                        type="email"
                        className="form-control"
                        placeholder="email"
                        value={userNew.email}
                        onChange={(e) => setUserNew({ ...userNew, email: e.target.value })}
                    />
                    <br />
                    <Input
                        type="text"
                        className="form-control"
                        placeholder="ethereum address"
                        value={userNew.ethereum_address}
                        onChange={(e) => setUserNew({ ...userNew, ethereum_address: e.target.value })}
                    />
                    <br />
                    <Input
                        type="text"
                        className="form-control"
                        placeholder="infura api key"
                        value={userNew.infura_api_key}
                        onChange={(e) => setUserNew({ ...userNew, infura_api_key: e.target.value })}
                    />
                    <br />
                    <Button onClick={(e) => userUpdate(e)} >upload</Button>
                    <Input
                        type="reset"
                        className="form-control"
                        value="reset"
                        onClick={() => setUserNew({ ...user })}
                    />
                </form>

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