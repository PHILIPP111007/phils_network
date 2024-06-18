import "./styles/ErrorMessage.css"

export default function ErrorMessage({ errorMessage }) {
    return (
        <div class="ErrorMessage">
            {errorMessage}
        </div>
    )
}