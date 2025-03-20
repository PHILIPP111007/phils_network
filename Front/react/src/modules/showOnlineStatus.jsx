import { CacheKeys, Language } from "../data/enums"

export default function showOnlineStatus({ user }) {
    var language = localStorage.getItem(CacheKeys.LANGUAGE)


    if (user.is_online) {
        if (language === Language.EN) {
            return <div className="onlineStatus">online</div>
        } else if (language === Language.RU) {
            return <div className="onlineStatus">онлайн</div>
        }
    } else {
        return
    }
}