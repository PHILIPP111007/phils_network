import '../styles/User.css'
import '../styles/Posts.css'
import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useInView } from 'react-intersection-observer'
import { UserContext, AuthContext } from '../data/context'
import { useObserver } from '../hooks/useObserver'
import { myFetch } from '../API/myFetch'
import Modal from '../components/Modal'
import ModalPostEdit from '../components/modals/ModalPostEdit'
import MainComponents from '../components/MainComponents'
import Post from '../components/Post'
import ModalPostCreate from '../components/modals/ModalPostCreate'
import UserStatus from '../components/UserStatus'
import Loading from '../components/Loading'
import LazyDiv from '../components/LazyDiv'
import plusIcon from '../images/plus-icon.svg'

export default function User() {

    const { setIsAuth } = useContext(AuthContext)
    const { user, setUser } = useContext(UserContext)
    const [userLocal, setUserLocal] = useState(user)
    let isUserGlobal = user.username === userLocal.username
    const [status, setStatus] = useState('')
    const [posts, setPosts] = useState([])
    const [post, setPost] = useState({})
    const [ref, inView] = useInView()
    const [loading, setLoading] = useState(true)
    const [text, setText] = useState('')
    const [modalPostEdit, setModalPostEdit] = useState(false)
    const [modalPostCreate, setModalPostCreate] = useState(false)
    const params = useParams()
    const token = localStorage.getItem('token')

    async function getPosts() {
        setLoading(true)
        await myFetch({ action: `api/blog/${params.username}/${posts.length}/`, method: 'GET', token: token })
            .then((data) => {
                if (data.status) {
                    setPosts([...posts, ...data.posts])
                }
                setLoading(false)
            })
    }

    async function deletePost(oldPost) {
        await myFetch({ action: `api/blog/${oldPost.id}/`, method: 'DELETE', token: token })
            .then((data) => {
                if (data.status) {
                    setPosts(posts.filter(post => post.id !== oldPost.id))
                    setModalPostEdit(false)
                }
            })
    }

    async function createPost(text) {
        setText('')
        setModalPostCreate(false)

        const newPost = {
            user: user.username,
            content: text,
        }

        await myFetch({ action: `api/blog/`, method: 'POST', body: newPost, token: token })
            .then((data) => {
                if (data.status) {
                    setPosts([data.post, ...posts])
                }
            })
    }

    async function editPost(newPost) {
        if (newPost.content.length > 0) {
            setModalPostEdit(false)
            newPost.is_changed = true

            await myFetch({ action: `api/blog/${newPost.id}/`, method: 'PUT', body: newPost, token: token })
                .then((data) => {
                    if (data.status) {
                        setPosts(posts.map(post => {
                            if (post.id === newPost.id) {
                                post.content = newPost.content
                                post.is_changed = true
                            }
                            return post
                        }))
                    }
                })
        }
    }

    function showPosts() {
        if (posts && (isUserGlobal || status === 'is_my_friend')) {
            return posts.map((post) =>
                <Post
                    key={post.id}
                    post={post}
                    linkShow={false}
                    settings={isUserGlobal}
                    setPost={setPost}
                    setModalPost={setModalPostEdit}
                />
            )
        }
    }

    useEffect(() => {
        if (token === null) {
            setIsAuth(false)
        }

        myFetch({ action: `api/user/${params.username}/`, method: 'GET', token: token })
            .then((data) => {
                setUser(data.global_user)
                if (data.local_user) {
                    setUserLocal(data.local_user)
                }
            })
    }, [])

    useObserver({inView: inView, func: getPosts})

    return (
        <div className="User">

            <MainComponents user={user} />

            <Modal modal={modalPostEdit} setModal={setModalPostEdit}>
                <ModalPostEdit post={post} setPost={setPost} editPost={editPost} deletePost={deletePost} />
            </Modal>

            <div className='UserCard'>
                <div>
                    <h3>{userLocal.first_name} {userLocal.last_name}</h3>
                    <div>@{userLocal.username}</div>
                </div>
                <div className='UserBtns'>
                    {!isUserGlobal
                        &&
                        <UserStatus username={params.username} status={status} setStatus={setStatus} />
                    }
                </div>
            </div>

            <Modal modal={modalPostCreate} setModal={setModalPostCreate}>
                <ModalPostCreate text={text} setText={setText} createPost={createPost} />
            </Modal>

            {isUserGlobal
                &&
                <div className='PostCreate'>
                    <img src={plusIcon} width="30px" onClick={() => setModalPostCreate(true)} alt="menu logo" />
                </div>
            }

            <div className='Posts'>
                {showPosts()}
                {loading && <Loading />}
            </div>

            <LazyDiv myRef={ref} />

        </div>
    )
}