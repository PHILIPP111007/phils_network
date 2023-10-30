import { useEffect } from "react"
import Fetch from "../API/Fetch"

export function useAuth({ username, setIsAuth }) {
    const Func = useEffect(() => {
        const token = localStorage.getItem("token")
        if (token === null) {
            setIsAuth(false)
        } else {
            setIsAuth(true)
        }
    }, [username])
    return Func
}

export function useSetUser({ username, setUser, setUserLocal }) {
    const Func = useEffect(() => {
        Fetch({ action: `api/user/${username}/`, method: "GET" })
            .then((data) => {
                if (data && data.global_user) {
                    setUser(data.global_user)
                    if (setUserLocal && data.local_user) {
                        setUserLocal(data.local_user)
                    }
                }
            })
    }, [username])
    return Func
}