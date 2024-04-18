import { useEffect } from "react"
import { Theme } from "@data/enums"


var html = document.getElementsByTagName("html")[0]

export default function useTheme() {

    var ThemeFunc = useEffect(() => {

        if (localStorage.getItem(Theme.NAME) === null) {
            html.className = Theme.LIGHT
            localStorage.setItem(Theme.NAME, Theme.LIGHT)
        } else {
            html.className = localStorage.getItem(Theme.NAME)
        }
    }, [])

    return ThemeFunc
}