import { HttpMethod } from "@data/enums"
import Fetch from "@API/Fetch"

export default async function UserSection(props) {

    await Fetch({ action: `friends/${props.option}/`, method: HttpMethod.GET })
        .then((data) => {
            if (data && data.ok) {
                props.setUserSection(data.query)
            }
            props.setLoading(false)
        })
}