import { CacheKeys } from "@data/enums"

export default function rememberPage(path) {
    localStorage.setItem(CacheKeys.REMEMBER_PAGE, path)
}