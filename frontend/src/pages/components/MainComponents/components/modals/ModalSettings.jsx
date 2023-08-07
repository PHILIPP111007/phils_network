import "./styles/ModalSettings.css"
import { useContext, useState } from "react"
import { UserContext } from "../../../../../data/context"
import Fetch from "../../../../../API/Fetch"
import Button from "../../../UI/Button"
import Input from "../../../UI/Input"

export default function ModalSettings(props) {

    const { user, setUser } = useContext(UserContext)
    const [userNew, setUserNew] = useState({ first_name: "", last_name: "", email: "" })

    async function userUpdate(event) {
        event.preventDefault()
        if (userNew.first_name || userNew.last_name || userNew.email) {
            await Fetch({ action: `api/user/${user.pk}/`, method: "PUT", body: userNew })
                .then((data) => {
                    if (data.user) {
                        setUser(data.user)
                    }
                })
        }
    }

    return (
        <div className="ModalSettings">
            <h2>Settings</h2>

            <label>Change personal info</label>
            <form>
                <Input
                    type="text"
                    placeholder="first name"
                    value={userNew.first_name}
                    onChange={(e) => setUserNew({ ...userNew, first_name: e.target.value })}
                />
                <br />
                <Input
                    type="text"
                    placeholder="last name"
                    value={userNew.last_name}
                    onChange={(e) => setUserNew({ ...userNew, last_name: e.target.value })}
                />
                <br />
                <Input
                    type="email"
                    placeholder="email"
                    value={userNew.email}
                    onChange={(e) => setUserNew({ ...userNew, email: e.target.value })}
                />
                <br />
                <Button onClick={(e) => userUpdate(e)} >upload</Button>
                <Input
                    type="reset"
                    value="reset"
                    onClick={() => setUserNew({})}
                />
            </form>

            <label>Danger zone</label>
            <br />
            <Button onClick={() => {
                props.setModalSettings(false)
                props.setModalDelAcc(true)
            }} >
                delete account
            </Button>
        </div>
    )
}