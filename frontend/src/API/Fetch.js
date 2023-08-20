export default async function Fetch({ action, method, body }) {

    const url = `${process.env.REACT_APP_DJANGO_URL}${action}`
    const token = localStorage.getItem("token")

    if (method === "GET") {
        const data = await fetch(url, {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": token ? `Token ${token}` : "",
            }
        })
            .then((response) => response.json())
            .then((data) => {
                if (!data.ok) {
                    console.error(`Not 2xx response, cause: ${data.error_message}`)
                }
                return data
            })
            .catch((error) => console.error(error))

        return data

    } else {
        const data = await fetch(url, {
            method: method,
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": token ? `Token ${token}` : "",
            },
            body: body ? JSON.stringify(body) : "",
        })
            .then((response) => response.json())
            .then((data) => {
                if (!data.ok) {
                    console.error(`Not 2xx response, cause: ${data.error_message}`)
                }
                return data
            })
            .catch((error) => console.error(error))

        return data
    }
}