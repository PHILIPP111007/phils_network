import "./styles/ModalRoomEdit.css"
import { useEffect, useState } from "react"
import Fetch from "../../../../API/Fetch"
import Loading from "../../../components/Loading"
import Button from "../../../components/UI/Button"

export default function ModalRoomEdit({ mainSets, setMainSets, me, editRoom }) {

    const [loading, setLoading] = useState(true)

    async function editSubscribers(subscriber) {
        setMainSets({
            ...mainSets,
            invitationChanges: {
                friends: mainSets.invitationChanges.friends,
                subscribers: mainSets.invitationChanges.subscribers.map((user) => {
                    if (user.pk === subscriber.pk) {
                        return { ...user, isInRoom: user.isInRoom ? false : true }
                    }
                    return user
                }),
            }
        })
    }

    async function editFriends(friend) {
        setMainSets({
            ...mainSets,
            invitationChanges: {
                subscribers: mainSets.invitationChanges.subscribers,
                friends: mainSets.invitationChanges.friends.map((user) => {
                    if (user.pk === friend.pk) {
                        return { ...user, isInRoom: user.isInRoom ? false : true }
                    }
                    return user
                }),
            }
        })
    }

    function subscribersShow() {
        return mainSets.invitationChanges.subscribers.map((user) =>
            <div key={user.username} className="card">
                <div className="info">
                    <div>
                        {user.first_name ? user.first_name : "No name"} {user.last_name ? user.last_name : "No name"} @{user.username}
                    </div>

                    {me.pk === user.pk &&
                        <div className="me">me</div>
                    }
                </div>

                {(mainSets.isCreator === true || user.pk === me.pk)
                    &&
                    <Button onClick={() => editSubscribers(user)} >
                        {user.isInRoom === true ? "delete" : "add"}
                    </Button>
                }
            </div>
        )
    }

    function friendsShow() {
        return mainSets.invitationChanges.friends.map((user) =>
            <div key={user.username} className="card">
                <div className="info">
                    <div>
                        {user.first_name} {user.last_name} @{user.username}
                    </div>
                </div>

                {mainSets.isCreator === true
                    &&
                    <Button onClick={() => editFriends(user)} >
                        {user.isInRoom === true ? "delete" : "add"}
                    </Button>
                }
            </div>
        )
    }

    useEffect(() => {
        if (mainSets.isCreator) {
            setLoading(true)

            Fetch({ action: "api/friends/friends/", method: "GET" })
                .then((data) => {
                    if (data.ok) {
                        let response = data.query
                        response = response.filter((friend) => {
                            const hasMatch = mainSets.room.subscribers_info.some(user => friend.pk === user.pk)
                            return !hasMatch
                        })
                        response = response.map((user) => {
                            return { ...user, isInRoom: false }
                        })
                        mainSets.invitationChanges.friends = response
                    }
                    setLoading(false)
                })
        }
    }, [mainSets.room.id])

    return (
        <div className="ModalRoomEdit">
            <Button onClick={() => editRoom()} >edit</Button>
            <br />
            <br />
            <h3>room users</h3>
            {subscribersShow()}

            {mainSets.isCreator === true && mainSets.invitationChanges.friends.length > 0
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