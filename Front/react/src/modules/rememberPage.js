import { LocalStorageKeys } from "@data/enums"

export default function rememberPage(path) {
    localStorage.setItem(LocalStorageKeys.REMEMBER_PAGE, path)
}