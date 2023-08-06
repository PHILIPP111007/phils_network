import { useMemo } from "react"

export default function useFriends(users, filter) {

    function lambda(user) {
        let flag = true

        if (filter.username && !user.username.toLowerCase().includes(filter.username.toLowerCase())) {
            flag = false
        }
        if (filter.first_name && !user.first_name.toLowerCase().includes(filter.first_name.toLowerCase())) {
            flag = false
        }
        if (filter.last_name && !user.last_name.toLowerCase().includes(filter.last_name.toLowerCase())) {
            flag = false
        }

        if (flag) {
            return true
        }
        return false
    }

    const searchedFriends = useMemo(() => {
        return users.filter(user => lambda(user))
    }, [filter, users])

    return searchedFriends
}