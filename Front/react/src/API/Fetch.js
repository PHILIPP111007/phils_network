import { HttpMethod } from "@data/enums"
import { FETCH_URL } from "@data/constants"
import getToken from "@modules/getToken"

export default async function Fetch({ action, method, body }) {

    // External token gives by auth() func

    var token = getToken()
    var data
    var url = `${FETCH_URL}${action}`

    if (method === HttpMethod.GET) {
        data = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json;text/plain",
                "Content-Type": "application/json;charset=UTF-8",
                "Access-Control-Allow-Origin": "*",
                "Authorization": token ? `Token ${token}` : "",
            },
            mode: 'cors',
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
                "Accept": "application/json;text/plain",
                "Content-Type": "application/json;charset=UTF-8",
                "Access-Control-Allow-Origin": "*",
                "Authorization": token ? `Token ${token}` : "",
            },
            mode: 'cors',
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