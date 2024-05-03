import { useEffect } from "react"
import { Theme } from "@data/enums"
import { rootElementTheme } from "@data/constants"

export default function useTheme() {

    var ThemeFunc = useEffect(() => {

        if (localStorage.getItem(Theme.NAME) === null) {
            rootElementTheme.className = Theme.LIGHT
            localStorage.setItem(Theme.NAME, Theme.LIGHT)
        } else {
            rootElementTheme.className = localStorage.getItem(Theme.NAME)
        }
    }, [])

    return ThemeFunc
}