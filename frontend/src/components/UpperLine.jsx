import '../styles/UpperLine.css'
import showHideBar from '../modules/showHideBar'
import menuLogo from '../images/lines_menu_burger_icon.svg'

export default function UpperLine(props) {
    return (
        <div className="UpperLine">
            {props.user.first_name
                ? props.user.first_name
                : 'No name'
            }
            <img src={menuLogo} onClick={() => showHideBar(props.setBarRef)} alt="menu logo" />
        </div>
    )
}