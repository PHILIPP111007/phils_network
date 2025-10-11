import { HttpMethod } from "../data/enums.js"
import Fetch from "../API/Fetch.js"

export default async function UserSection(props) {

    await Fetch({ api_version: 2, action: `friends/${props.option}/`, method: HttpMethod.GET })
        .then((data) => {
            if (data && data.ok) {
                props.setUserSection(data.query)
            }
            props.setLoading(false)
        })
}