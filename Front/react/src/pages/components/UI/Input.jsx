import "./styles/Input.css"

export default function Input(props) {
    return (
        <input {...props} className={`Input form-control ${props.className || ''}`} />
    )
}