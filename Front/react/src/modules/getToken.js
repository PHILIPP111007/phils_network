import { LocalStorageKeys } from "@data/enums"

export default function getToken() {
    return localStorage.getItem(LocalStorageKeys.TOKEN)
}