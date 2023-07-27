import { useEffect } from "react"

export const useObserver = (props) => {

    const Fetch = useEffect(() => {
        if (props.inView) {
            props.func()
        }
    }, [props.inView])

    return Fetch
}