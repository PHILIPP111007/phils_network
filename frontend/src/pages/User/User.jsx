import "./styles/User.css"
import "../../styles/Posts.css"
import { useContext, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useInView } from "react-intersection-observer"
import { UserContext, AuthContext } from "../../data/context"
import { useAuth, useSetUser } from "../../hooks/useAuth"
import useObserver from "../../hooks/useObserver"
import Fetch from "../../API/Fetch"
import Modal from "../components/Modal"
import ModalPostEdit from "./components/modals/ModalPostEdit"
import ModalPostCreate from "./components/modals/ModalPostCreate"
import MainComponents from "../components/MainComponents/MainComponents"
import Post from "../components/Post"
import UserStatus from "../components/UserStatus"
import LazyDiv from "../components/LazyDiv"
import ScrollToTopOrBottom from "../components/MainComponents/components/ScrollToTopOrBottom"
import plusIcon from "../../images/plus-icon.svg"

export default function User() {

    const { setIsAuth } = useContext(AuthContext)
    const { user, setUser } = useContext(UserContext)
    const [ref, inView] = useInView()
    const params = useParams()

    const [userLocal, setUserLocal] = useState(user)
    const [posts, setPosts] = useState([])
    const [status, setStatus] = useState("")
    const [modalPostEdit, setModalPostEdit] = useState(false)
    const [modalPostCreate, setModalPostCreate] = useState(false)
    let isUserGlobal = user.username === userLocal.username

    const [mainSets, setMainSets] = useState({
        post: {},
        text: "",
        loading: true,
    })

    localStorage.setItem("path", "/user/")

    async function getPosts(postsLength) {
        setMainSets({ ...mainSets, loading: true })

        if (postsLength === undefined) {
            postsLength = posts.length
        }

        const data = await Fetch({ action: `api/blog/${params.username}/${postsLength}/`, method: "GET" })
        if (data && data.ok) {
            const newPosts = data.posts.map(post => {
                return { ...post, postLen500: post.content.length > 500, btnFlag: true }
            })
            setPosts([...posts, ...newPosts])
        }
        setMainSets({ ...mainSets, loading: false })
    }

    async function deletePost(oldPost) {
        const data = await Fetch({ action: `api/blog/${oldPost.id}/`, method: "DELETE" })
        if (data && data.ok) {
            setPosts(posts.filter(post => post.id !== oldPost.id))
            setModalPostEdit(false)
        }
    }

    async function createPost(text) {
        setMainSets({ ...mainSets, text: "" });
        setModalPostCreate(false)
        let newPost = {
            user: user.pk,
            content: text,
        };

        const data = await Fetch({ action: "api/blog/", method: "POST", body: newPost })
        if (data && data.ok) {
            newPost = { ...data.post, postLen500: data.post.content.length > 500, btnFlag: true }
            setPosts([newPost, ...posts])
        }
    }

    async function editPost(newPost) {
        if (newPost.content.length > 0) {
            setModalPostEdit(false)
            newPost.changed = true

            const data = await Fetch({ action: `api/blog/${newPost.id}/`, method: "PUT", body: newPost })
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

    function showPosts() {
        if (posts && (isUserGlobal || status === "is_my_friend")) {
            return posts.map((post) =>
                <Post
                    key={post.id}
                    post={post}
                    linkShow={false}
                    settings={isUserGlobal}
                    posts={posts}
                    setPosts={setPosts}
                    mainSets={mainSets}
                    setMainSets={setMainSets}
                    setModalPost={setModalPostEdit}
                />
            )
        }
    }

    useEffect(() => {
        setPosts([])
        getPosts(0)
    }, [params.username])


    useAuth({ username: params.username, setIsAuth: setIsAuth })

    useSetUser({ username: params.username, setUser: setUser, setUserLocal: setUserLocal })

    useObserver({ inView: inView, func: getPosts })

    return (
        <div className="User">
            <MainComponents user={user} loading={mainSets.loading} />

            <ScrollToTopOrBottom bottom={false} />

            <Modal modal={modalPostEdit} setModal={setModalPostEdit}>
                <ModalPostEdit mainSets={mainSets} setMainSets={setMainSets} editPost={editPost} deletePost={deletePost} />
            </Modal>

            <div className="UserCard">
                <div>
                    <h3>{userLocal.first_name} {userLocal.last_name}</h3>
                    <div>@{userLocal.username}</div>
                </div>
                <div className="UserBtns">
                    {!isUserGlobal
                        &&
                        <UserStatus pk={userLocal.pk} status={status} setStatus={setStatus} />}
                </div>
            </div>

            <Modal modal={modalPostCreate} setModal={setModalPostCreate}>
                <ModalPostCreate mainSets={mainSets} setMainSets={setMainSets} createPost={createPost} />
            </Modal>

            {(isUserGlobal && !mainSets.loading)
                &&
                <div className="PostCreate">
                    <img src={plusIcon} onClick={() => setModalPostCreate(true)} alt="menu logo" />
                </div>}

            <div className="Posts">
                {showPosts()}
            </div>

            <LazyDiv Ref={ref} />
        </div>
    );
}
