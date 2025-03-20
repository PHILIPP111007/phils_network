import { useEffect } from "react"
import { CacheKeys, Language } from "../data/enums"

export default function useLanguage() {

    var LanguageFunc = useEffect(() => {
        if (localStorage.getItem(CacheKeys.LANGUAGE) === null) {
            localStorage.setItem(CacheKeys.LANGUAGE, Language.EN)
        }
    }, [])

    return LanguageFunc
}