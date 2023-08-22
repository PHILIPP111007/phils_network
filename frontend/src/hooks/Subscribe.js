import Fetch from "../API/Fetch"

export default class Subscribe {

    static deleteFriend(props) {
        const body = { option: "delete_friend" }
        Fetch({ action: `api/subscriber/${props.pk}/`, method: "DELETE", body: body })
            .then(() => {
                props.setStatus(undefined)
            })
    }

    static deleteSubscriber(props) {
        const body = { option: "delete_subscriber" }
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