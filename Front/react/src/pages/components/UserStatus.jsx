import "./styles/UserStatus.css"
import { useEffect } from "react"
import { HttpMethod, UserStatusEnum, CacheKeys, Language } from "../../data/enums"
import Subscribe from "../../hooks/Subscribe"
import Fetch from "../../API/Fetch"
import Button from "./UI/Button"

export default function UserStatus(props) {
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    useEffect(() => {
        if (!props.status) {
            Fetch({ action: `api/v2/subscriber/${props.id}/`, method: HttpMethod.GET })
                .then((data) => {
                    if (data && data.status) {
                        props.setStatus(data.status)
                    }
                })
        }
    }, [props.status])

    if (language === Language.EN) {
        var DictUserStatusDiv = {
            [UserStatusEnum.IS_FRIEND]: (
                <Button onClick={() => {
                    Subscribe.deleteFriend({
                        id: props.id,
                        setStatus: props.setStatus
                    })
                }
                } >delete friend</Button>
            ),
            [UserStatusEnum.ME_SUBSCRIBER]: (
                <Button onClick={() => {
                    Subscribe.deleteFriend({
                        id: props.id,
                        setStatus: props.setStatus
                    })
                }
                } >delete subscription</Button>
            ),
            [UserStatusEnum.HE_SUBSCRIBER]: (
                <>
                    <Button onClick={() => {
                        Subscribe.deleteSubscriber({
                            id: props.id,
                            setStatus: props.setStatus
                        })
                    }
                    } >delete his subscription</Button>

                    <Button onClick={() => {
                        Subscribe.addSubscription({
                            id: props.id,
                            setStatus: props.setStatus
                        })
                    }
                    } >add</Button>
                </>
            ),
            [UserStatusEnum.NO_DATA]: (
                <Button onClick={() => {
                    Subscribe.addSubscription({
                        id: props.id,
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
    } else if (language === Language.RU) {
        var DictUserStatusDiv = {
            [UserStatusEnum.IS_FRIEND]: (
                <Button onClick={() => {
                    Subscribe.deleteFriend({
                        id: props.id,
                        setStatus: props.setStatus
                    })
                }
                } >удалить друга</Button>
            ),
            [UserStatusEnum.ME_SUBSCRIBER]: (
                <Button onClick={() => {
                    Subscribe.deleteFriend({
                        id: props.id,
                        setStatus: props.setStatus
                    })
                }
                } >удалить подписку</Button>
            ),
            [UserStatusEnum.HE_SUBSCRIBER]: (
                <>
                    <Button onClick={() => {
                        Subscribe.deleteSubscriber({
                            id: props.id,
                            setStatus: props.setStatus
                        })
                    }
                    } >удалить его подписку</Button>

                    <Button onClick={() => {
                        Subscribe.addSubscription({
                            id: props.id,
                            setStatus: props.setStatus
                        })
                    }
                    } >добавить</Button>
                </>
            ),
            [UserStatusEnum.NO_DATA]: (
                <Button onClick={() => {
                    Subscribe.addSubscription({
                        id: props.id,
                        setStatus: props.setStatus
                    })
                }
                } >добавить</Button>
            )
        }

        return (
            <div className="UserStatus" >
                {DictUserStatusDiv[props.status]}
            </div>
        )
    }
}