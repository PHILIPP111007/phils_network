import "./styles/ErrorMessage.css"

export default function ErrorMessage({ errorMessage }) {
    return (
        <div className="ErrorMessage">
            {errorMessage}
        </div>
    )
}