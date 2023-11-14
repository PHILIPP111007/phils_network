import "./styles/UserStatus.css"
import { useEffect } from "react"
import { UserStatusEnum } from "../../data/userStatus"
import Fetch from "../../API/Fetch"
import Button from "./UI/Button"
import Subscribe from "../../hooks/Subscribe"

export default function UserStatus(props) {

    useEffect(() => {
        Fetch({ action: `api/subscriber/${props.pk}/`, method: "GET" })
            .then((data) => {
                if (data && data.status) {
                    props.setStatus(data.status)
                }
            })
    }, [props.status])

    switch (props.status) {
        case UserStatusEnum.IS_FRIEND:
            return (
                <div className="UserStatus" >
                    <Button onClick={() => {
                        Subscribe.deleteFriend({
                            pk: props.pk,
                            setStatus: props.setStatus
                        })
                    }
                    } >delete friend</Button>
                </div>
            )
        case UserStatusEnum.ME_SUBSCRIBER:
            return (
                <div className="UserStatus" >
                    <Button onClick={() => {
                        Subscribe.deleteFriend({
                            pk: props.pk,
                            setStatus: props.setStatus
                        })
                    }
                    } >delete subscription</Button>
                </div>
            )
        case UserStatusEnum.HE_SUBSCRIBER:
            return (
                <div className="UserStatus" >
                    <Button onClick={() => {
                        Subscribe.deleteSubscriber({
                            pk: props.pk,
                            setStatus: props.setStatus
                        })
                    }
                    } >delete his subscription</Button>

                    <Button onClick={() => {
                        Subscribe.addSubscription({
                            pk: props.pk,
                            setStatus: props.setStatus
                        })
                    }
                    } >add</Button>
                </div>
            )
        case UserStatusEnum.NO_DATA:
            return (
                <div className="UserStatus" >
                    <Button onClick={() => {
                        Subscribe.addSubscription({
                            pk: props.pk,
                            setStatus: props.setStatus
                        })
                    }
                    } >add</Button>
                </div>
            )
    }
}