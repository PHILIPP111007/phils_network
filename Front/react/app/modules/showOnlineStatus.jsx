import { CacheKeys, Language } from "../data/enums.js"

export default function showOnlineStatus({ user }) {
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    if (user.is_online) {
        if (language === Language.EN) {
            return <span className="onlineStatus">online</span>
        } else if (language === Language.RU) {
            return <span className="onlineStatus">онлайн</span>
        }
    } else {
        return
    }
}