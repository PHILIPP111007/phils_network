import { useEffect } from "react"
import { Theme } from "@data/enums"
import { ROOT_ELEMENT_THEME } from "@data/constants"

export default function useTheme() {

    var ThemeFunc = useEffect(() => {

        if (localStorage.getItem(Theme.NAME) === null) {
            ROOT_ELEMENT_THEME.className = Theme.LIGHT
            localStorage.setItem(Theme.NAME, Theme.LIGHT)
        } else {
            ROOT_ELEMENT_THEME.className = localStorage.getItem(Theme.NAME)
        }
    }, [])

    return ThemeFunc
}