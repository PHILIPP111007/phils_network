// import "./styles/Input.css"

export default function Input(props) {
    return (
        <input {...props} className={`Input Form form-control ${props.className || ''}`} />
    )
}