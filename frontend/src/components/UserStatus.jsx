import '../styles/UserStatus.css'
import { useEffect } from "react"
import { myFetch } from "../API/myFetch"
import Button from "./UI/Button"
import Subscribe from "../hooks/Subscribe"

export default function UserStatus(props) {

    const token = localStorage.getItem('token')

    useEffect(() => {
        myFetch({ action: `api/subscriber/${props.pk}/`, method: 'GET', token: token })
            .then((data) => {
                props.setStatus(data.status)
            })
    }, [props.status])

    switch (props.status) {
        case 'is_my_friend':
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
        case 'i_am_subscriber':
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
        case 'he_is_subscriber':
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
        case 'no_data':
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