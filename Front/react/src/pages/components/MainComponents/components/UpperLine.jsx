import "./styles/UpperLine.css"
import { use } from "react"
import { useParams } from "react-router-dom"
import { UserContext, AuthContext } from "../../../../data/context"
import { useSetUser, useAuth } from "../../../../hooks/useAuth"
import { showLanguage, setLanguage } from "../../../../modules/language"
import { CacheKeys, Language } from "../../../../data/enums"
import showHideBar from "../../../../modules/showHideBar"
import menuLogo from "../../../../images/lines_menu_burger_icon.svg"
import Loading from "../../Loading"

export default function UpperLine(props) {

    var { setIsAuth } = use(AuthContext)
    var { user, setUser } = use(UserContext)
    var params = useParams()
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    useAuth({ username: params.username, setIsAuth: setIsAuth })
    useSetUser({ username: params.username, setUser: setUser })

    if (language === Language.EN) {
        return (
            <div className="UpperLine">
                <div>
                    {user.first_name
                        ? user.first_name
                        : "No name"
                    }
                </div>

                {(props.roomName && !props.loading) &&
                    <div>
                        {props.roomName}
                    </div>
                }

                {props.loading && <Loading />}

                <div>
                    <select onChange={event => setLanguage(event)} className="LanguageSelect" name="language">
                        {showLanguage()}
                    </select>
                    <img src={menuLogo} onClick={() => showHideBar(props.setBarRef)} alt="menu logo" />
                </div>
            </div>
        )
    } else if (language === Language.RU) {
        return (
            <div className="UpperLine">
                <div>
                    {user.first_name
                        ? user.first_name
                        : "Нет имени"
                    }
                </div>

                {(props.roomName && !props.loading) &&
                    <div>
                        {props.roomName}
                    </div>
                }

                {props.loading && <Loading />}

                <div>
                    <select onChange={event => setLanguage(event)} className="LanguageSelect" name="language">
                        {showLanguage()}
                    </select>
                    <img src={menuLogo} onClick={() => showHideBar(props.setBarRef)} alt="логотип меню" />
                </div>
            </div>
        )
    }
}