import "../styles/UpperLine.css"
import showHideBar from "../modules/showHideBar"
import menuLogo from "../images/lines_menu_burger_icon.svg"

export default function UpperLine(props) {
    return (
        <div className="UpperLine">
            <div>
                {props.user.first_name
                    ? props.user.first_name
                    : "No name"
                }
            </div>
            <div>
                {props.roomName && props.roomName}
            </div>
            <img src={menuLogo} onClick={() => showHideBar(props.setBarRef)} alt="menu logo" />
        </div>
    )
}