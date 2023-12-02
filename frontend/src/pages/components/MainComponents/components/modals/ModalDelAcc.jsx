import "./styles/ModalDelAcc.css"
import { useContext } from "react"
import { HttpMethod } from "@data/enums"
import { AuthContext, UserContext } from "@data/context"
import Fetch from "@API/Fetch"
import Button from "@pages/components/UI/Button"

export default function ModalDelAcc() {

    const { setIsAuth } = useContext(AuthContext)
    const { user } = useContext(UserContext)

    async function deleteAccount() {
        const data = await Fetch({ action: `api/user/${user.pk}/`, method: HttpMethod.DELETE })
        if (data.ok) {
            localStorage.removeItem("token")
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