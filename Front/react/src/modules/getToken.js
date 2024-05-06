import { CacheKeys } from "@data/enums"

export default function getToken() {
    return localStorage.getItem(CacheKeys.TOKEN)
}