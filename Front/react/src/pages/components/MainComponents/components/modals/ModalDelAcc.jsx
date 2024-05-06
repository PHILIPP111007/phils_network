import "./styles/ModalDelAcc.css"
import { useContext } from "react"
import { HttpMethod, CacheKeys } from "@data/enums"
import { AuthContext, UserContext } from "@data/context"
import Fetch from "@API/Fetch"
import Button from "@pages/components/UI/Button"

export default function ModalDelAcc() {

    var { setIsAuth } = useContext(AuthContext)
    var { user } = useContext(UserContext)

    async function deleteAccount() {
        var data = await Fetch({ action: `user/${user.pk}/`, method: HttpMethod.DELETE })
        if (data.ok) {
            localStorage.clear()
            setIsAuth(false)
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