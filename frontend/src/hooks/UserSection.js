import { myFetch } from "../API/myFetch"

export async function UserSection(props) {
    const token = localStorage.getItem("token")
    await myFetch({ action: `api/friends/${props.option}/`, method: "GET", token: token })
        .then((data) => {
            if (data.status) {
                props.setUserSection(data.query)
            }
            props.setLoading(false)
        })
}