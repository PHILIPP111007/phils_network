import { useEffect } from "react"
import { Theme, LocalStorageKeys } from "@data/enums"
import { ROOT_ELEMENT_THEME } from "@data/constants"

export default function useTheme() {

    var ThemeFunc = useEffect(() => {
        if (localStorage.getItem(LocalStorageKeys.THEME) === null) {
            ROOT_ELEMENT_THEME.className = Theme.LIGHT
            localStorage.setItem(LocalStorageKeys.THEME, Theme.LIGHT)
        } else {
            ROOT_ELEMENT_THEME.className = localStorage.getItem(LocalStorageKeys.THEME)
        }
    }, [])

    return ThemeFunc
}