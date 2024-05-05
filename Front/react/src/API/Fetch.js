import { HttpMethod, LocalStorageKeys } from "@data/enums"
import { FETCH_URL } from "@data/constants"

export default async function Fetch({ action, method, body, token }) {

    // External token gives by auth() func
    if (token === undefined) {
        token = localStorage.getItem(LocalStorageKeys.TOKEN)
    }

    var data
    var url = `${FETCH_URL}${action}`

    if (method === HttpMethod.GET) {
        data = await fetch(url, {
            method: "GET",
            headers: {
                "accept": "application/json; charset=utf-8",
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": token ? `Token ${token}` : "",
            }
        })
            .then((response) => response.json())
            .then((data) => {
                if (!data.ok) {
                    console.warn(`Not 2xx response: ${data.error}`)
                }
                return data
            })
            .catch((error) => console.error(error))

        return data

    } else {
        data = await fetch(url, {
            method: method,
            headers: {
                "accept": "application/json; charset=utf-8",
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": token ? `Token ${token}` : "",
            },
            body: body ? JSON.stringify(body) : "",
        })
            .then((response) => response.json())
            .then((data) => {
                if (!data.ok) {
                    console.warn(`Not 2xx response: ${data.error}`)
                }
                return data
            })
            .catch((error) => console.error(error))

        return data
    }
}