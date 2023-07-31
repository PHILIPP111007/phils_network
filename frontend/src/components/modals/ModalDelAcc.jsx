import '../../styles/ModalDelAcc.css'
import { useContext } from 'react'
import { myFetch } from '../../API/myFetch'
import { AuthContext, UserContext } from '../../data/context'
import Button from "../UI/Button"

export default function ModalDelAcc() {

    const token = localStorage.getItem('token')
    const { setIsAuth } = useContext(AuthContext)
    const { user } = useContext(UserContext)

    async function deleteAccount() {
        await myFetch({ action: `api/user/${user.username}/`, method: 'DELETE', token: token })
            .then((data) => {
                if (data.status) {
                    localStorage.removeItem('token')
                    setIsAuth(false)
                }
            })
    }

    return (
        <div className='ModalDelAcc'>
            <h2>Are you sure?</h2>
            <br />
            <Button onClick={() => deleteAccount()} >delete account</Button>
        </div>
    )
}