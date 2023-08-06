import { useEffect } from "react"

export default function useObserver(props) {

    const Fetch = useEffect(() => {
        if (props.inView) {
            props.func()
        }
    }, [props.inView])

    return Fetch
}