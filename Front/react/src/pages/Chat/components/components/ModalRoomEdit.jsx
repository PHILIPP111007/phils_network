import "./styles/ModalRoomEdit.css"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { FilterOption, HttpMethod, CacheKeys, Language } from "../../../../data/enums.js"
import Fetch from "../../../../API/Fetch.js"
import Loading from "../../../components/Loading.jsx"
import Button from "../../../components/UI/Button.jsx"
import showOnlineStatus from "../../../../modules/showOnlineStatus.jsx"

export default function ModalRoomEdit({ mainSets, me, editRoom }) {

    var [loading, setLoading] = useState(true)
    var language = localStorage.getItem(CacheKeys.LANGUAGE)

    async function editSubscribers(subscriber) {
        mainSets.value = {
            ...mainSets.value,
            invitationChanges: {
                friends: mainSets.value.invitationChanges.friends,
                subscribers: mainSets.value.invitationChanges.subscribers.map((user) => {
                    if (user.id === subscriber.id) {
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
                    if (user.id === friend.id) {
                        return { ...user, isInRoom: !user.isInRoom }
                    }
                    return user
                })
            }
        }
    }

    function subscribersShow() {
        if (language === Language.EN) {
            return mainSets.value.invitationChanges.subscribers.map((user) =>
                <div key={user.username} className="card">
                    <div className="info">
                        <div>
                            <Link to={`/users/${user.username}/`} >
                                {user.first_name ? user.first_name : "No name"} {user.last_name ? user.last_name : "No name"} @{user.username} {showOnlineStatus({ user: user })}
                            </Link>
                        </div>

                        {me.id === user.id &&
                            <div className="me">me</div>
                        }
                    </div>

                    {(mainSets.value.isCreator === true || user.id === me.id)
                        &&
                        <Button onClick={() => editSubscribers(user)} >
                            {user.isInRoom ? "delete" : "add"}
                        </Button>
                    }
                </div>
            )
        } else if (language === Language.RU) {
            return mainSets.value.invitationChanges.subscribers.map((user) =>
                <div key={user.username} className="card">
                    <div className="info">
                        <div>
                            <Link to={`/users/${user.username}/`} >
                                {user.first_name ? user.first_name : "No name"} {user.last_name ? user.last_name : "No name"} @{user.username} {showOnlineStatus({ user: user })}
                            </Link>
                        </div>

                        {me.id === user.id &&
                            <div className="me">я</div>
                        }
                    </div>

                    {(mainSets.value.isCreator === true || user.id === me.id)
                        &&
                        <Button onClick={() => editSubscribers(user)} >
                            {user.isInRoom ? "удалить" : "добавить"}
                        </Button>
                    }
                </div>
            )
        }
    }

    function friendsShow() {
        if (language === Language.EN) {
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
        } else if (language === Language.RU) {
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
                            {user.isInRoom ? "удалить" : "добавить"}
                        </Button>
                    }
                </div>
            )
        }
    }

    useEffect(() => {
        if (mainSets.value.isCreator) {
            setLoading(true)

            Fetch({ action: `api/v2/friends/${FilterOption.FRIENDS}/`, method: HttpMethod.GET })
                .then((data) => {
                    if (data && data.ok) {
                        var response = data.query
                        response = response.filter((friend) => {
                            var hasMatch = mainSets.value.room.subscribers_info.some(user => friend.id === user.id)
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

    if (language === Language.EN) {
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
    } else if (language === Language.RU) {
        return (
            <div className="ModalRoomEdit">
                <h3>{mainSets.value.room.name}</h3>
                <br />
                <Button onClick={() => editRoom()} >edit</Button>
                <br />
                <br />
                <h3>пользователи комнаты</h3>

                {subscribersShow()}

                {mainSets.value.isCreator === true && mainSets.value.invitationChanges.friends.length > 0
                    &&
                    <>
                        <br />
                        <hr />
                        <br />
                        <h3>пригласить друзей</h3>
                        {friendsShow()}
                        {loading && <Loading />}
                    </>
                }
            </div>
        )
    }
}