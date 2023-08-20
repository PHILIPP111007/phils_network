import { useEffect } from "react"

export default function useObserver(props) {

    const ObserveFunc = useEffect(() => {
        if (props.inView) {
            props.func()
        }
    }, [props.inView])

    return ObserveFunc
}