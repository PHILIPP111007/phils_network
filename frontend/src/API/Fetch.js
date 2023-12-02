import { HttpMethod } from "@data/enums"

export default async function Fetch({ action, method, body, token }) {

    // External token gives by auth() func
    if (token === undefined) {
        token = localStorage.getItem("token")
    }

    const url = `${process.env.REACT_APP_SERVER_URL}${action}`

    if (method === HttpMethod.GET) {
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