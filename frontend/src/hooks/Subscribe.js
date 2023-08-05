import { myFetch } from "../API/myFetch"

export default class Subscribe {

    static deleteFriend(props) {
        const token = localStorage.getItem("token")
        const body = { flag: "delete_friend" }
        myFetch({ action: `api/subscriber/${props.pk}/`, method: "DELETE", body: body, token: token })
            .then((data) => {
                if (data.status) {
                    props.setStatus(undefined)
                }
            })
    }

    static deleteSubscriber(props) {
        const token = localStorage.getItem("token")
        const body = { flag: "delete_subscriber" }
        myFetch({ action: `api/subscriber/${props.pk}/`, method: "DELETE", body: body, token: token })
            .then((data) => {
                if (data.status) {
                    props.setStatus(undefined)
                }
            })
    }

    static addSubscription(props) {
        const token = localStorage.getItem("token")
        myFetch({ action: `api/subscriber/${props.pk}/`, method: "POST", token: token })
            .then((data) => {
                if (data.status) {
                    props.setStatus(undefined)
                }
            })
    }
}