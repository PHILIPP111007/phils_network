import "./styles/User.css"
import "../../styles/Posts.css"
import { use, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useInView } from "react-intersection-observer"
import Card from "react-bootstrap/Card"
import { UserContext } from "../../data/context.js"
import { useSetUser } from "../../hooks/useAuth.js"
import { HttpMethod } from "../../data/enums.js"
import useObserver from "../../hooks/useObserver.js"
import rememberPage from "../../modules/rememberPage.js"
import Fetch from "../../API/Fetch.js"
import MainComponents from "../components/MainComponents/MainComponents.jsx"
import Modal from "../components/Modal.jsx"
import ModalPostEdit from "./components/ModalPostEdit.jsx"
import ModalPostCreate from "./components/ModalPostCreate.jsx"
import Posts from "../components/Posts.jsx"
import UserStatus from "../components/UserStatus.jsx"
import LazyDiv from "../components/LazyDiv.jsx"
import ScrollToTopOrBottom from "../components/MainComponents/components/ScrollToTopOrBottom.jsx"
import showOnlineStatus from "../../modules/showOnlineStatus.jsx"
import plusIcon from "../../images/plus-icon.svg"
import profileIcon from "../../images/icon-profile.svg.png"

export default function User() {

    var { user, setUser } = use(UserContext)
    var [ref, inView] = useInView()
    var params = useParams()
    var [userLocal, setUserLocal] = useState(user)
    var [imageUrl, setImageUrl] = useState(null)
    var [posts, setPosts] = useState([])
    var [status, setStatus] = useState("")
    var [modalPostEdit, setModalPostEdit] = useState(false)
    var [modalPostCreate, setModalPostCreate] = useState(false)
    var [mainSets, setMainSets] = useState({
        post: {
            btnFlag: false,
            changed: false,
            timestamp: "",
            user: {
                username: "",
                first_name: "",
                last_name: ""
            },
            content: "",
            postLen500: false
        },
        loading: true,
    })
    var isUserGlobal = user.username === userLocal.username

    async function getPosts(postsLength) {
        setMainSets({ ...mainSets, loading: true })

        if (postsLength === undefined) {
            postsLength = posts.length
        }

        var data = await Fetch({ action: `api/v2/blog/${params.username}/${postsLength}/`, method: HttpMethod.GET })
        if (data && data.ok) {
            var newPosts = data.posts.map(post => {
                return { ...post, postLen500: post.content.length > 500 }
            })
            setPosts((prev) => [...prev, ...newPosts])
        }
        setMainSets({ ...mainSets, loading: false })
    }

    async function deletePost(oldPost) {
        var data = await Fetch({ action: `api/v2/blog/${oldPost.id}/`, method: HttpMethod.DELETE })
        if (data && data.ok) {
            setPosts((prev) => prev.filter(post => post.id !== oldPost.id))
            setModalPostEdit(false)
        }
    }

    async function createPost(text) {
        var sendingText = await text.trim()

        if (sendingText.length > 0) {
            setModalPostCreate(false)
            var newPost = {
                user: user.id,
                content: sendingText,
            }
    
            var data = await Fetch({ action: "api/v2/blog/", method: HttpMethod.POST, body: newPost })
            if (data && data.ok) {
                newPost = { ...data.post, postLen500: data.post.content.length > 500, btnFlag: true }
                setPosts([newPost, ...posts])
            }
        }
    }

    async function editPost(newPost) {
        newPost.content = newPost.content.trim()
        if (newPost.content.length > 0) {
            setModalPostEdit(false)
            newPost.changed = true

            var data = await Fetch({ action: `api/v2/blog/${newPost.id}/`, method: HttpMethod.PUT, body: newPost })
            if (data && data.ok) {
                setPosts(posts.map(post => {
                    if (post.id === newPost.id) {
                        post.content = newPost.content
                        post.changed = true
                    }
                    return post
                }))
            }
        }
    }

    useEffect(() => {
        rememberPage(`users/${params.username}`)
        setPosts((prev) => [])
        getPosts(0)
    }, [params.username])

    useEffect(() => {
        var timezoneOffset = Intl.DateTimeFormat().resolvedOptions().timeZone
        var body = { timezone: timezoneOffset }
        Fetch({ action: "api/v2/timezone/", method: HttpMethod.POST, body: body })
    }, [])

    useEffect(() => {
        if (userLocal.image) {
            var byteCharacters = atob(userLocal.image)
            var byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            var uint8Array = new Uint8Array(byteNumbers)
            var blob = new Blob([uint8Array], { type: 'application/octet-stream' })
            var url = URL.createObjectURL(blob)

            setImageUrl(url)
        } else {
            setImageUrl(null)
        }
    }, [userLocal.image])

    useSetUser({ username: params.username, setUser: setUser, setUserLocal: setUserLocal })

    useObserver({ inView: inView, func: getPosts, flag: !mainSets.loading })

    return (
        <div className="User">
            <MainComponents loading={mainSets.loading} />

            <ScrollToTopOrBottom bottom={false} />

            <Card className="UserCard text-center align-items-center" style={{ width: "100rem" }}>
                <Card.Img variant="top" src={imageUrl ? imageUrl : profileIcon} style={{ width: "40%" }} />
                <Card.Body>
                    <Card.Title>{userLocal.first_name} {userLocal.last_name}</Card.Title>
                    <Card.Text>
                        @{userLocal.username} {showOnlineStatus({ user: userLocal })}
                    </Card.Text>
                </Card.Body>
                <Card.Body>
                    <div className="UserBtns">
                    {!isUserGlobal
                        &&
                        <UserStatus id={userLocal.id} status={status} setStatus={setStatus} />}
                    </div>
                </Card.Body>
            </Card>

            <Modal modal={modalPostCreate} setModal={setModalPostCreate}>
                <ModalPostCreate createPost={createPost} />
            </Modal>

            <Modal modal={modalPostEdit} setModal={setModalPostEdit}>
                <ModalPostEdit mainSets={mainSets} setMainSets={setMainSets} editPost={editPost} deletePost={deletePost} />
            </Modal>

            {(isUserGlobal && !mainSets.loading)
                &&
                <div className="PostCreate">
                    <img src={plusIcon} onClick={() => setModalPostCreate(true)} alt="menu logo" />
                </div>}

            <Posts
                posts={posts}
                linkShow={false}
                settings={isUserGlobal}
                mainSets={mainSets}
                setMainSets={setMainSets}
                setModalPost={setModalPostEdit}
            />
            <LazyDiv Ref={ref} />
        </div>
    )
}
