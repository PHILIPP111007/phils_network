import { lazy } from "react"
var User = lazy(() => import("../pages/User/User.jsx"))
var News = lazy(() => import("../pages/News.jsx"))
var Friends = lazy(() => import("../pages/Friends/Friends.jsx"))
var FriendsSection = lazy(() => import("../pages/FriendsSection.jsx"))
var SubscriptionsSection = lazy(() => import("../pages/SubscriptionsSection.jsx"))
var SubscribersSection = lazy(() => import("../pages/SubscribersSection.jsx"))
var Rooms = lazy(() => import("../pages/Rooms/Rooms.jsx"))
var RoomInvitations = lazy(() => import("../pages/Rooms/components/RoomInvitations.jsx"))
var Chat = lazy(() => import("../pages/Chat/Chat.jsx"))
var Login = lazy(() => import("../pages/Login/Login.jsx"))
var Register = lazy(() => import("../pages/Register.jsx"))

export var PublicRoutes = [
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

export var PrivateRoutes = [
    {
        path: "/users/:username/",
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
        path: "/invite_chats/:username/",
        name: "RoomInvitations",
        element: <RoomInvitations />
    },
    {
        path: "/chats/:username/:room_id/",
        name: "chat",
        element: <Chat />
    },
]