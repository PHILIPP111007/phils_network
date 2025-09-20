// import "./styles/Input.css"

export default function Input(props) {
    return (
        <input className={`Input Form form-control ${props.className || ""}`} {...props} />
    )
}