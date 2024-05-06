import { useEffect } from "react"
import { HttpMethod } from "@data/enums"
import Fetch from "@API/Fetch"
import getToken from "@modules/getToken"

export function useAuth({ username, setIsAuth }) {
    var Func = useEffect(() => {
        var token = getToken()
        if (token === null) {
            setIsAuth(false)
        } else {
            setIsAuth(true)
        }
    }, [username])
    return Func
}

export function useSetUser({ username, setUser, setUserLocal }) {
    var Func = useEffect(() => {
        Fetch({ action: `user/${username}/`, method: HttpMethod.GET })
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