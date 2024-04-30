import "./styles/UpperLine.css"
import { useContext } from "react"
import { useParams } from "react-router-dom"
import { UserContext, AuthContext } from "@data/context"
import { useSetUser, useAuth } from "@hooks/useAuth"
import showHideBar from "@modules/showHideBar"
import menuLogo from "@images/lines_menu_burger_icon.svg"
import Loading from "@pages/components/Loading"

export default function UpperLine(props) {

    var { setIsAuth } = useContext(AuthContext)
    var { user, setUser } = useContext(UserContext)
    var params = useParams()

    useAuth({ username: params.username, setIsAuth: setIsAuth })
    useSetUser({ username: params.username, setUser: setUser })

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

            <img src={menuLogo} onClick={() => showHideBar(props.setBarRef)} alt="menu logo" />
        </div>
    )
}