import { HttpMethod, DeleteOptionEnum } from "../data/enums.js"
import Fetch from "../API/Fetch.js"

export default class Subscribe {

    static deleteFriend(props) {
        var body = { option: DeleteOptionEnum.DELETE_FRIEND }
        Fetch({ action: `api/v2/subscriber/${props.id}/`, method: HttpMethod.DELETE, body: body })
            .then(() => {
                props.setStatus(undefined)
            })
    }

    static deleteSubscriber(props) {
        var body = { option: DeleteOptionEnum.DELETE_SUBSCRIBER }
        Fetch({ action: `api/v2/subscriber/${props.id}/`, method: HttpMethod.DELETE, body: body })
            .then(() => {
                props.setStatus(undefined)
            })
    }

    static addSubscription(props) {
        Fetch({ action: `api/v2/subscriber/${props.id}/`, method: HttpMethod.POST })
            .then(() => {
                props.setStatus(undefined)
            })
    }
}