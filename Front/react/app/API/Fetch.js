import { HttpMethod, APIVersion } from "../data/enums"
import { DEVELOPMENT, PROD_FETCH_URL, DEVELOPMENT_DJANGO_FETCH_URL, DEVELOPMENT_FASTAPI_FETCH_URL } from "../data/constants"
import getToken from "../modules/getToken"

export default async function Fetch({ api_version, action, method, body, token, is_uploading_file }) {

    // External token gives by auth() func

    if (!token && token !== "") {
        token = getToken()
    }

    var url
    var data

    if (DEVELOPMENT == "1") {
        if (api_version === APIVersion.V1) {
            url = `${DEVELOPMENT_DJANGO_FETCH_URL}api/v${api_version}/${action}`
        } else if (api_version === APIVersion.V2) {
            url = `${DEVELOPMENT_FASTAPI_FETCH_URL}api/v${api_version}/${action}`
        }
    } else (
        url = `${PROD_FETCH_URL}api/v${api_version}/${action}`
    )

    if (method === HttpMethod.GET) {
        data = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json;text/plain",
                "Content-Type": "application/json;charset=UTF-8",
                "Authorization": token ? `Token ${token}` : "",
            },
            mode: "cors",
        })
            .then((response) => response.json())
            .then((data) => {
                if (!data.ok) {
                    if (data.error) {
                        console.warn(`Not 2xx response: ${data.error}`)
                    }

                    if (data.detail) {
                        console.warn(data.detail)
                    }
                }
                return data
            })
            .catch((error) => console.error(error))

        return data

    } else {
        var headers

        if (is_uploading_file) {
            headers = {
                "Accept": "application/json;text/plain",
                "Authorization": token ? `Token ${token}` : "",
            }
        } else {
            body = body ? JSON.stringify(body) : ""
            headers = {
                "Accept": "application/json;text/plain",
                "Content-Type": "application/json;charset=UTF-8",
                "Authorization": token ? `Token ${token}` : "",
            }
        }

        data = await fetch(url, {
            method: method,
            headers: headers,
            mode: "cors",
            body: body,
        })
            .then((response) => response.json())
            .then((data) => {
                if (!data.ok) {
                    if (data.error) {
                        console.warn(`Not 2xx response: ${data.error}`)
                    }

                    if (data.detail) {
                        console.warn(data.detail)
                    }
                }
                return data
            })
            .catch((error) => console.error(error))

        return data
    }
}