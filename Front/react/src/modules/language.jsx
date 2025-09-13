import { Language, CacheKeys } from "../data/enums.js"

export function showLanguage() {
    var languages = []
    var languageLocalStorage = localStorage.getItem(CacheKeys.LANGUAGE)

    languages.push(<option key={languageLocalStorage} value={languageLocalStorage}>{languageLocalStorage}</option>)

    for (var language in Language) {
        if (Language[language] !== languageLocalStorage) {
            languages.push(<option key={Language[language]} value={Language[language]}>{Language[language]}</option>)
        }
    }
    return languages
}

export function setLanguage(event) {
    localStorage.setItem(CacheKeys.LANGUAGE, event.target.value)
}