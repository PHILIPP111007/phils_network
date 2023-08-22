import Fetch from "../API/Fetch"

export default async function UserSection(props) {
    await Fetch({ action: `api/friends/${props.option}/`, method: "GET" })
        .then((data) => {
            if (data.ok) {
                props.setUserSection(data.query)
            }
            props.setLoading(false)
        })
}