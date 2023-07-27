export async function myFetch({ action, method, body, token }) {

    const url = `${process.env.REACT_APP_DJANGO_HOST}${action}`

    console.log(url)

    if (method === 'GET') {
        try {
            const response = await fetch(url, {
                method: method,
                credentials: "same-origin",
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": token ? `Token ${token}` : "",
                }
            })
            const data = await response.json()
            return data
        } catch (error) {
            console.log(error)
        }
    } else {
        try {
            const response = await fetch(url, {
                method: method,
                credentials: "same-origin",
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": token ? `Token ${token}` : "",
                },
                body: body ? JSON.stringify(body) : "",
            })
            const data = await response.json()
            return data
        } catch (error) {
            console.log(error)
        }
    }
}