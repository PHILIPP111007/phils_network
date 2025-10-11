import { HttpMethod, DeleteOptionEnum } from "../data/enums.js"
import Fetch from "../API/Fetch.js"

export default class Subscribe {

    static deleteFriend(props) {
        Fetch({ api_version: 2, action: `delete_subscriber/${DeleteOptionEnum.DELETE_FRIEND}/${props.id}/`, method: HttpMethod.DELETE })
            .then(() => {
                props.setStatus(undefined)
            })
    }

    static deleteSubscriber(props) {
        Fetch({ api_version: 2, action: `delete_subscriber/${DeleteOptionEnum.DELETE_SUBSCRIBER}/${props.id}/`, method: HttpMethod.DELETE })
            .then(() => {
                props.setStatus(undefined)
            })
    }

    static addSubscription(props) {
        Fetch({ api_version: 2, action: `subscriber/${props.id}/`, method: HttpMethod.POST })
            .then(() => {
                props.setStatus(undefined)
            })
    }
}