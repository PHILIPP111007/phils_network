import "./styles/Button.css"
import { default as BootstrapButton } from 'react-bootstrap/Button';

var Button = ({ children, ...props }) => {
    return (
        <BootstrapButton className="Button" variant="secondary" {...props} >
            {children}
        </BootstrapButton>
    )
}

export default Button