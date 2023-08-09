import Fetch from "../API/Fetch"

export default async function UserSection(props) {
    const token = localStorage.getItem("token")
    await Fetch({ action: `api/friends/${props.option}/`, method: "GET", token: token })
        .then((data) => {
            if (data) {
                props.setUserSection(data.query)
            }
            props.setLoading(false)
        })
}