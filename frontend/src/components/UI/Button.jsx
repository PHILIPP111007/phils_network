import '../../styles/Button.css'

const Button = ({ children, ...props }) => {
    return (
        <button {...props} className='Button'>
            {children}
        </button>
    )
}

export default Button