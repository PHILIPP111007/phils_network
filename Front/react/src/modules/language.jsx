import { Language, CacheKeys } from "../data/enums"

export function showLanguage() {
    var languages = []
    var languageLocalStorage = localStorage.getItem(CacheKeys.LANGUAGE)

    languages.push(<option value={languageLocalStorage}>{languageLocalStorage}</option>)

    for (var language in Language) {
        if (Language[language] !== languageLocalStorage) {
            languages.push(<option value={Language[language]}>{Language[language]}</option>)
        }
    }
    return languages
}

export function setLanguage(event) {
    localStorage.setItem(CacheKeys.LANGUAGE, event.target.value)
}