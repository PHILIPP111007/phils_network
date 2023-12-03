import { useEffect } from "react"

export default function useObserver(props) {

    const ObserveFunc = useEffect(() => {
        if (props.inView) {
            if (props.flag !== undefined) {
                if (props.flag) {
                    props.func()
                }
            } else {
                props.func()
            }
        }
    }, [props.inView])

    return ObserveFunc
}