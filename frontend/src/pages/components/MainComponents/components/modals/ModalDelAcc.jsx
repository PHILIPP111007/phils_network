import "./styles/ModalDelAcc.css"
import { useContext } from "react"
import { AuthContext, UserContext } from "../../../../../data/context"
import Fetch from "../../../../../API/Fetch"
import Button from "../../../UI/Button"

export default function ModalDelAcc() {

    const token = localStorage.getItem("token")
    const { setIsAuth } = useContext(AuthContext)
    const { user } = useContext(UserContext)

    async function deleteAccount() {
        await Fetch({ action: `api/user/${user.pk}/`, method: "DELETE", token: token })
            .then((data) => {
                if (data.status) {
                    localStorage.removeItem("token")
                    setIsAuth(false)
                }
            })
    }

    return (
        <div className="ModalDelAcc">
            <h2>Are you sure?</h2>
            <br />
            <Button onClick={() => deleteAccount()} >delete account</Button>
        </div>
    )
}