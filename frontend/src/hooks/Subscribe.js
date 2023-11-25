import { HttpMethod } from "../data/enums"
import Fetch from "../API/Fetch"
import { DeleteOptionEnum } from "../data/enums"

export default class Subscribe {

    static deleteFriend(props) {
        const body = { option: DeleteOptionEnum.DELETE_FRIEND }
        Fetch({ action: `api/subscriber/${props.pk}/`, method: HttpMethod.DELETE, body: body })
            .then(() => {
                props.setStatus(undefined)
            })
    }

    static deleteSubscriber(props) {
        const body = { option: DeleteOptionEnum.DELETE_SUBSCRIBER }
        Fetch({ action: `api/subscriber/${props.pk}/`, method: HttpMethod.DELETE, body: body })
            .then(() => {
                props.setStatus(undefined)
            })
    }

    static addSubscription(props) {
        Fetch({ action: `api/subscriber/${props.pk}/`, method: HttpMethod.POST })
            .then(() => {
                props.setStatus(undefined)
            })
    }
}