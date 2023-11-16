import "./styles/UserStatus.css"
import { useEffect } from "react"
import { UserStatusEnum } from "../../data/enums"
import Fetch from "../../API/Fetch"
import Button from "./UI/Button"
import Subscribe from "../../hooks/Subscribe"

export default function UserStatus(props) {

    useEffect(() => {
        if (!props.status) {
            Fetch({ action: `api/subscriber/${props.pk}/`, method: "GET" })
                .then((data) => {
                    if (data && data.status) {
                        props.setStatus(data.status)
                    }
                })
        }
    }, [props.status])

    const DictUserStatusDiv = {
        [UserStatusEnum.IS_FRIEND]: (
            <>
                <Button onClick={() => {
                    Subscribe.deleteFriend({
                        pk: props.pk,
                        setStatus: props.setStatus
                    })
                }
                } >delete friend</Button>
            </>
        ),
        [UserStatusEnum.ME_SUBSCRIBER]: (
            <>
                <Button onClick={() => {
                    Subscribe.deleteFriend({
                        pk: props.pk,
                        setStatus: props.setStatus
                    })
                }
                } >delete subscription</Button>
            </>
        ),
        [UserStatusEnum.HE_SUBSCRIBER]: (
            <>
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
            </>
        ),
        [UserStatusEnum.NO_DATA]: (
            <>
                <Button onClick={() => {
                    Subscribe.addSubscription({
                        pk: props.pk,
                        setStatus: props.setStatus
                    })
                }
                } >add</Button>
            </>
        )
    }

    return (
        <div className="UserStatus" >
            {DictUserStatusDiv[props.status]}
        </div>
    )
}