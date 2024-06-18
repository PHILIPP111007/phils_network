import "./styles/User.css"
import "../../styles/Posts.css"
import { useContext, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useInView } from "react-intersection-observer"
import { UserContext } from "@data/context"
import { useSetUser } from "@hooks/useAuth"
import { HttpMethod } from "@data/enums"
import useObserver from "@hooks/useObserver"
import rememberPage from "@modules/rememberPage"
import Fetch from "@API/Fetch"
import MainComponents from "@pages/components/MainComponents/MainComponents"
import Modal from "@pages/components/Modal"
import ModalPostEdit from "@pages/User/components/modals/ModalPostEdit"
import ModalPostCreate from "@pages/User/components/modals/ModalPostCreate"
import Posts from "@pages/components/Posts"
import UserStatus from "@pages/components/UserStatus"
import LazyDiv from "@pages/components/LazyDiv"
import ScrollToTopOrBottom from "@pages/components/MainComponents/components/ScrollToTopOrBottom"
import plusIcon from "@images/plus-icon.svg"

export default function User() {

    var { user, setUser } = useContext(UserContext)
    var [ref, inView] = useInView()
    var params = useParams()
    var [userLocal, setUserLocal] = useState(user)
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

        var data = await Fetch({ action: `blog/${params.username}/${postsLength}/`, method: HttpMethod.GET })
        if (data && data.ok) {
            var newPosts = data.posts.map(post => {
                return { ...post, postLen500: post.content.length > 500 }
            })
            setPosts((prev) => [...prev, ...newPosts])
        }
        setMainSets({ ...mainSets, loading: false })
    }

    async function deletePost(oldPost) {
        var data = await Fetch({ action: `blog/${oldPost.id}/`, method: HttpMethod.DELETE })
        if (data && data.ok) {
            setPosts((prev) => prev.filter(post => post.id !== oldPost.id))
            setModalPostEdit(false)
        }
    }

    async function createPost(text) {
        setModalPostCreate(false)
        var newPost = {
            user: user.pk,
            content: text,
        }

        var data = await Fetch({ action: "blog/", method: HttpMethod.POST, body: newPost })
        if (data && data.ok) {
            newPost = { ...data.post, postLen500: data.post.content.length > 500, btnFlag: true }
            setPosts([newPost, ...posts])
        }
    }

    async function editPost(newPost) {
        newPost.content = newPost.content.trim()
        if (newPost.content.length > 0) {
            setModalPostEdit(false)
            newPost.changed = true

            var data = await Fetch({ action: `blog/${newPost.id}/`, method: HttpMethod.PUT, body: newPost })
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
        rememberPage("users")
        setPosts((prev) => [])
        getPosts(0)
    }, [params.username])

    useSetUser({ username: params.username, setUser: setUser, setUserLocal: setUserLocal })

    useObserver({ inView: inView, func: getPosts, flag: !mainSets.loading })

    return (
        <div className="User">
            <MainComponents loading={mainSets.loading} />

            <ScrollToTopOrBottom bottom={false} />

            <div className="UserCard">
                <h3>{userLocal.first_name} {userLocal.last_name}</h3>
                <div>@{userLocal.username}</div>
                <div className="UserBtns">
                    {!isUserGlobal
                        &&
                        <UserStatus pk={userLocal.pk} status={status} setStatus={setStatus} />}
                </div>
            </div>

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
