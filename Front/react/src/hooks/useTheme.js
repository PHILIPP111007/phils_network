import { useEffect } from "react"
import { Theme, CacheKeys } from "@data/enums"
import { ROOT_ELEMENT_THEME } from "@data/constants"

export default function useTheme() {

    var ThemeFunc = useEffect(() => {
        if (localStorage.getItem(CacheKeys.THEME) === null) {
            ROOT_ELEMENT_THEME.className = Theme.LIGHT
            localStorage.setItem(CacheKeys.THEME, Theme.LIGHT)
        } else {
            ROOT_ELEMENT_THEME.className = localStorage.getItem(CacheKeys.THEME)
        }
    }, [])

    return ThemeFunc
}