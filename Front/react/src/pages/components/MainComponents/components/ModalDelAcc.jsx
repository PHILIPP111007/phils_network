import "./styles/ModalDelAcc.css"
import { use } from "react"
import { HttpMethod } from "../../../../data/enums"
import { AuthContext, UserContext } from "../../../../data/context"
import Fetch from "../../../../API/Fetch"
import Button from "../../../components/UI/Button"

export default function ModalDelAcc() {

    var { setIsAuth } = use(AuthContext)
    var { user, setUser } = use(UserContext)

    async function deleteAccount() {
        var data = await Fetch({ action: `user/${user.pk}/`, method: HttpMethod.DELETE })
        if (data.ok) {
            localStorage.clear()
            setIsAuth(false)
            setUser({
                pk: 0,
                username: "",
                email: "",
                first_name: "",
                last_name: ""
            })
        }
    }

    return (
        <div className="ModalDelAcc">
            <h2>Are you sure?</h2>
            <br />
            <Button onClick={() => deleteAccount()} >delete account</Button>
        </div>
    )
}