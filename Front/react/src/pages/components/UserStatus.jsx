import "./styles/UserStatus.css"
import { useEffect } from "react"
import { HttpMethod, UserStatusEnum } from "../../data/enums"
import Subscribe from "../../hooks/Subscribe"
import Fetch from "../../API/Fetch"
import Button from "./UI/Button"

export default function UserStatus(props) {

    useEffect(() => {
        if (!props.status) {
            Fetch({ action: `api/v1/subscriber/${props.pk}/`, method: HttpMethod.GET })
                .then((data) => {
                    if (data && data.status) {
                        props.setStatus(data.status)
                    }
                })
        }
    }, [props.status])

    var DictUserStatusDiv = {
        [UserStatusEnum.IS_FRIEND]: (
            <Button onClick={() => {
                Subscribe.deleteFriend({
                    pk: props.pk,
                    setStatus: props.setStatus
                })
            }
            } >delete friend</Button>
        ),
        [UserStatusEnum.ME_SUBSCRIBER]: (
            <Button onClick={() => {
                Subscribe.deleteFriend({
                    pk: props.pk,
                    setStatus: props.setStatus
                })
            }
            } >delete subscription</Button>
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
            <Button onClick={() => {
                Subscribe.addSubscription({
                    pk: props.pk,
                    setStatus: props.setStatus
                })
            }
            } >add</Button>
        )
    }

    return (
        <div className="UserStatus" >
            {DictUserStatusDiv[props.status]}
        </div>
    )
}