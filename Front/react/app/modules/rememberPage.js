import { CacheKeys } from "../data/enums.js"

export default function rememberPage(path) {
    localStorage.setItem(CacheKeys.REMEMBER_PAGE, path)
}