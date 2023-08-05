import "../../styles/ModalRoomEdit.css"
import { useEffect, useState } from "react"
import { myFetch } from "../../API/myFetch"
import Loading from "../Loading"
import Button from "../UI/Button"

export default function ModalRoomEdit(props) {

    const [loading, setLoading] = useState(true)
    const token = localStorage.getItem("token")

    function editSubscribers(subscriber) {
        props.setInvitationChanges({
            friends: props.invitationChanges.friends,
            subscribers: props.invitationChanges.subscribers.map((user) => {
                if (user.pk === subscriber.pk) {
                    return { ...user, isInRoom: user.isInRoom ? false : true }
                }
                return user
            }),
        })
    }

    function editFriends(friend) {
        props.setInvitationChanges({
            subscribers: props.invitationChanges.subscribers,
            friends: props.invitationChanges.friends.map((user) => {
                if (user.pk === friend.pk) {
                    return { ...user, isInRoom: user.isInRoom ? false : true }
                }
                return user
            }),
        })
    }

    function subscribersShow() {
        return props.invitationChanges.subscribers.map((user) =>
            <div key={user.username} className="card">
                <div className="info">
                    <div>{user.first_name ? user.first_name : "No name"} {user.last_name ? user.last_name : "No name"} @{user.username}</div>
                </div>

                {props.isCreator === true || user.pk === props.me.pk
                    ?
                    <Button onClick={() => editSubscribers(user)} >
                        {user.isInRoom === true ? "delete" : "add"}
                    </Button>
                    : undefined
                }
            </div>
        )
    }

    function friendsShow() {
        return props.invitationChanges.friends.map((user) =>
            <div key={user.username} className="card">
                <div className="info">
                    <div>{user.first_name} {user.last_name} @{user.username}</div>
                </div>

                {props.isCreator === true
                    ?
                    <Button onClick={() => editFriends(user)} >
                        {user.isInRoom === true ? "delete" : "add"}
                    </Button>
                    : undefined
                }
            </div>
        )
    }

    useEffect(() => {
        if (props.isCreator) {
            setLoading(true)

            myFetch({ action: "api/friends/friends/", method: "GET", token: token })
                .then((data) => {
                    if (data.status) {
                        let response = data.query
                        response = response.filter((friend) => {
                            const hasMatch = props.room.subscribers_info.some(user => friend.pk === user.pk)
                            return !hasMatch
                        })
                        response = response.map((user) => {
                            return { ...user, isInRoom: false }
                        })
                        props.invitationChanges.friends = response
                    }
                    setLoading(false)
                })
        }
    }, [props.room.name])

    return (
        <div className="ModalRoomEdit">
            <Button onClick={() => props.editRoom()} >edit</Button>
            <br />
            <br />
            <h3>room users</h3>
            {subscribersShow()}

            {props.isCreator === true && props.invitationChanges.friends.length > 0
                &&
                <div>
                    <br />
                    <hr />
                    <br />
                    <h3>friends</h3>
                    {friendsShow()}
                    {loading && <Loading />}
                </div>
            }
        </div>
    )
}