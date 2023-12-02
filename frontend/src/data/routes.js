import { lazy } from "react"
const User = lazy(() => import("@pages/User/User"))
const Rooms = lazy(() => import("@pages/Rooms/Rooms"))
const News = lazy(() => import("@pages/News"))
const Friends = lazy(() => import("@pages/Friends/Friends"))
const FriendsSection = lazy(() => import("@pages/FriendsSection"))
const SubscriptionsSection = lazy(() => import("@pages/SubscriptionsSection"))
const SubscribersSection = lazy(() => import("@pages/SubscribersSection"))
const Chat = lazy(() => import("@pages/Chat/Chat"))
const Login = lazy(() => import("@pages/Login/Login"))
const Register = lazy(() => import("@pages/Register"))

export const PublicRoutes = [
    {
        path: "/",
        element: <Login />
    },
    {
        path: "/login/",
        element: <Login />
    },
    {
        path: "/register/",
        element: <Register />
    },
]

export const PrivateRoutes = [
    {
        path: "/user/:username/",
        name: "User",
        element: <User />
    },
    {
        path: "/news/:username/",
        name: "News",
        element: <News />
    },
    {
        path: "/friends/:username/",
        name: "Friends",
        element: <Friends />
    },
    {
        path: "/friends/:username/friends-section/",
        name: "friends",
        element: <FriendsSection />
    },
    {
        path: "/friends/:username/subscriptions-section/",
        name: "subscriptions",
        element: <SubscriptionsSection />
    },
    {
        path: "/friends/:username/subscribers-section/",
        name: "subscribers",
        element: <SubscribersSection />
    },
    {
        path: "/chats/:username/",
        name: "Chats",
        element: <Rooms />
    },
    {
        path: "/chats/:username/:room_id/",
        name: "chat",
        element: <Chat />
    },
]