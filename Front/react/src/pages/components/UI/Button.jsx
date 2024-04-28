import "./styles/Button.css"

var Button = ({ children, ...props }) => {
    return (
        <button {...props} className="Button">
            {children}
        </button>
    )
}

export default Button