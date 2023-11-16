import Fetch from "../API/Fetch"
import { DeleteOptionEnum } from "../data/enums"

export default class Subscribe {

    static deleteFriend(props) {
        const body = { option: DeleteOptionEnum.DELETE_FRIEND }
        Fetch({ action: `api/subscriber/${props.pk}/`, method: "DELETE", body: body })
            .then(() => {
                props.setStatus(undefined)
            })
    }

    static deleteSubscriber(props) {
        const body = { option: DeleteOptionEnum.DELETE_SUBSCRIBER }
        Fetch({ action: `api/subscriber/${props.pk}/`, method: "DELETE", body: body })
            .then(() => {
                props.setStatus(undefined)
            })
    }

    static addSubscription(props) {
        Fetch({ action: `api/subscriber/${props.pk}/`, method: "POST" })
            .then(() => {
                props.setStatus(undefined)
            })
    }
}