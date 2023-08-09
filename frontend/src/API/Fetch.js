async function responseValidation(response) {
    if (response.ok) {
        const data = await response.json()
        return data
    } else {
        return null
    }
}

export default async function Fetch({ action, method, body }) {

    const url = `${process.env.REACT_APP_DJANGO_URL}${action}`
    const token = localStorage.getItem("token")

    try {
        if (method === "GET") {
            const response = await fetch(url, {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Authorization": token ? `Token ${token}` : "",
                }
            })

            const data = await responseValidation(response)
            return data

        } else {
            const response = await fetch(url, {
                method: method,
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Authorization": token ? `Token ${token}` : "",
                },
                body: body ? JSON.stringify(body) : "",
            })

            const data = await responseValidation(response)
            return data

        }
    } catch (error) {
        console.warn(error)
    }
}