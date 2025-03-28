import "./styles/ModalDelAcc.css"
import { use } from "react"
import { HttpMethod, CacheKeys, Language } from "../../../../data/enums"
import { AuthContext, UserContext } from "../../../../data/context"
import Fetch from "../../../../API/Fetch"
import Button from "../../../components/UI/Button"

export default function ModalDelAcc() {

    var { setIsAuth } = use(AuthContext)
    var { user, setUser } = use(UserContext)
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    async function deleteAccount() {
        var data = await Fetch({ action: `api/v2/user/${user.username}/`, method: HttpMethod.DELETE })
        if (data.ok) {
            localStorage.clear()
            setIsAuth(false)
            setUser({
                id: 0,
                username: "",
                email: "",
                first_name: "",
                last_name: ""
            })
        }
    }

    if (language === Language.EN) {
        return (
            <div className="ModalDelAcc">
                <h2>Are you sure?</h2>
                <br />
                <Button onClick={() => deleteAccount()} >delete account</Button>
            </div>
        )
    } else if (language === Language.RU) {
        return (
            <div className="ModalDelAcc">
                <h2>Вы уверены?</h2>
                <br />
                <Button onClick={() => deleteAccount()} >удалить аккаунт</Button>
            </div>
        )
    }
}