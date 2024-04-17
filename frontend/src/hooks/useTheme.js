import { useEffect } from "react"
import { Theme } from "@data/enums"


export default function useTheme(body) {
    var ThemeFunc = useEffect(() => {
        if (localStorage.getItem(Theme.NAME) !== null) {
            body.className = localStorage.getItem(Theme.NAME)
        } else {
            body.className = Theme.LIGHT
            localStorage.setItem(Theme.NAME, Theme.LIGHT)
        }
    }, [])

    return ThemeFunc
}