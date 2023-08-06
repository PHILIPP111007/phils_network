import User from "../pages/User/User"
import Rooms from "../pages/Rooms/Rooms"
import News from "../pages/News"
import Friends from "../pages/Friends/Friends"
import FriendsSection from "../pages/FriendsSection"
import SubscriptionsSection from "../pages/SubscriptionsSection"
import SubscribersSection from "../pages/SubscribersSection"
import Chat from "../pages/Chat/Chat"
import Login from "../pages/Login/Login"
import Register from "../pages/Register"

export const privateRoutes = [
    { path: "/user/:username/", name: "User", element: <User /> },
    { path: "/news/:username/", name: "News", element: <News /> },
    { path: "/friends/:username/", name: "Friends", element: <Friends /> },

    { path: "/friends/:username/friends-section/", name: "friends", element: <FriendsSection /> },
    { path: "/friends/:username/subscriptions-section/", name: "subscriptions", element: <SubscriptionsSection /> },
    { path: "/friends/:username/subscribers-section/", name: "subscribers", element: <SubscribersSection /> },

    { path: "/chats/:username/", name: "Chats", element: <Rooms /> },
    { path: "/chats/:username/:room_id/", name: "chat", element: <Chat /> },
]

export const publicRoutes = [
    { path: "/", element: <Login /> },
    { path: "/login/", element: <Login /> },
    { path: "/register/", element: <Register /> },
]
