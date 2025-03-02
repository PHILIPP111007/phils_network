import "./styles/ModalRoomEdit.css"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { FilterOption, HttpMethod } from "../../../../data/enums"
import Fetch from "../../../../API/Fetch"
import Loading from "../../../components/Loading"
import Button from "../../../components/UI/Button"
import showOnlineStatus from "../../../../modules/showOnlineStatus"

export default function ModalRoomEdit({ mainSets, me, editRoom }) {

    var [loading, setLoading] = useState(true)

    async function editSubscribers(subscriber) {
        mainSets.value = {
            ...mainSets.value,
            invitationChanges: {
                friends: mainSets.value.invitationChanges.friends,
                subscribers: mainSets.value.invitationChanges.subscribers.map((user) => {
                    if (user.pk === subscriber.pk) {
                        return { ...user, isInRoom: !user.isInRoom }
                    }
                    return user
                })
            }
        }
    }

    async function editFriends(friend) {
        mainSets.value = {
            ...mainSets.value,
            invitationChanges: {
                subscribers: mainSets.value.invitationChanges.subscribers,
                friends: mainSets.value.invitationChanges.friends.map((user) => {
                    if (user.pk === friend.pk) {
                        return { ...user, isInRoom: !user.isInRoom }
                    }
                    return user
                })
            }
        }
    }

    function subscribersShow() {
        return mainSets.value.invitationChanges.subscribers.map((user) =>
            <div key={user.username} className="card">
                <div className="info">
                    <div>
                        <Link to={`/users/${user.username}/`} >
                            {user.first_name ? user.first_name : "No name"} {user.last_name ? user.last_name : "No name"} @{user.username} {showOnlineStatus({ user: user })}
                        </Link>
                    </div>

                    {me.pk === user.pk &&
                        <div className="me">me</div>
                    }
                </div>

                {(mainSets.value.isCreator === true || user.pk === me.pk)
                    &&
                    <Button onClick={() => editSubscribers(user)} >
                        {user.isInRoom ? "delete" : "add"}
                    </Button>
                }
            </div>
        )
    }

    function friendsShow() {
        return mainSets.value.invitationChanges.friends.map((user) =>
            <div key={user.username} className="card">
                <div className="info">
                    <div>
                        <Link to={`/users/${user.username}/`} >
                            {user.first_name} {user.last_name} @{user.username} {showOnlineStatus({ user: user })}
                        </Link>
                    </div>
                </div>

                {mainSets.value.isCreator === true
                    &&
                    <Button onClick={() => editFriends(user)} >
                        {user.isInRoom ? "delete" : "add"}
                    </Button>
                }
            </div>
        )
    }

    useEffect(() => {
        if (mainSets.value.isCreator) {
            setLoading(true)

            Fetch({ action: `api/v1/friends/${FilterOption.FRIENDS}/`, method: HttpMethod.GET })
                .then((data) => {
                    if (data && data.ok) {
                        var response = data.query
                        response = response.filter((friend) => {
                            var hasMatch = mainSets.value.room.subscribers_info.some(user => friend.pk === user.pk)
                            return !hasMatch
                        })
                        response = response.map((user) => {
                            return { ...user, isInRoom: false }
                        })
                        mainSets.value.invitationChanges.friends = response
                    }
                    setLoading(false)
                })
        }
    }, [mainSets.value.room.id])

    return (
        <div className="ModalRoomEdit">
            <h3>{mainSets.value.room.name}</h3>
            <br />
            <Button onClick={() => editRoom()} >edit</Button>
            <br />
            <br />
            <h3>room users</h3>

            {subscribersShow()}

            {mainSets.value.isCreator === true && mainSets.value.invitationChanges.friends.length > 0
                &&
                <>
                    <br />
                    <hr />
                    <br />
                    <h3>invite friends</h3>
                    {friendsShow()}
                    {loading && <Loading />}
                </>
            }
        </div>
    )
}