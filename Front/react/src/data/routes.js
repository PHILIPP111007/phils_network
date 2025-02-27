import { lazy } from "react"
var User = lazy(() => import("../pages/User/User"))
var News = lazy(() => import("../pages/News"))
var Friends = lazy(() => import("../pages/Friends/Friends"))
var FriendsSection = lazy(() => import("../pages/FriendsSection"))
var SubscriptionsSection = lazy(() => import("../pages/SubscriptionsSection"))
var SubscribersSection = lazy(() => import("../pages/SubscribersSection"))
var Rooms = lazy(() => import("../pages/Rooms/Rooms"))
var RoomInvitations = lazy(() => import("../pages/Rooms/components/RoomInvitations"))
var Chat = lazy(() => import("../pages/Chat/Chat"))
var Login = lazy(() => import("../pages/Login/Login"))
var Register = lazy(() => import("../pages/Register"))

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