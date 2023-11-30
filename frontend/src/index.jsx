import ReactDOM from "react-dom/client"
import App from "./App"
import { useSignal } from "@preact/signals-react"

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(<App />)