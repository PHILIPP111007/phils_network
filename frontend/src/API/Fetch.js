export default async function Fetch({ action, method, body }) {

    const url = `${process.env.REACT_APP_DJANGO_URL}${action}`
    const token = localStorage.getItem("token")

    if (method === "GET") {
        try {
            const response = await fetch(url, {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token ? `Token ${token}` : "",
                }
            })
            const data = await response.json()
            return data
        } catch (error) {
            console.error(error)
        }
    } else {
        try {
            const response = await fetch(url, {
                method: method,
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token ? `Token ${token}` : "",
                },
                body: body ? JSON.stringify(body) : "",
            })
            const data = await response.json()
            return data
        } catch (error) {
            console.error(error)
        }
    }
}