import { CacheKeys } from "../data/enums.js"

export default function getToken() {
    return localStorage.getItem(CacheKeys.TOKEN)
}