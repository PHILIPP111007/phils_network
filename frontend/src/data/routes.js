import User from "../pages/User"
import Rooms from "../pages/Rooms"
import News from "../pages/News"
import Friends from "../pages/Friends"
import FriendsSection from "../pages/FriendsSection"
import SubscriptionsSection from "../pages/SubscriptionsSection"
import SubscribersSection from "../pages/SubscribersSection"
import Chat from "../pages/Chat"

export const privateRoutes = [
    { path: "/user/:username/", name: "User", element: <User />, exact: true },
    { path: "/news/:username/", name: "News", element: <News />, exact: true },
    { path: "/friends/:username/", name: "Friends", element: <Friends />, exact: true },

    { path: "/friends/:username/friends-section/", name: "friends", element: <FriendsSection />, exact: true },
    { path: "/friends/:username/subscriptions-section/", name: "subscriptions", element: <SubscriptionsSection />, exact: true },
    { path: "/friends/:username/subscribers-section/", name: "subscribers", element: <SubscribersSection />, exact: true },

    { path: "/chats/:username/", name: "Chats", element: <Rooms />, exact: true },
    { path: "/chats/:username/:room_id/", name: "chat", element: <Chat />, exact: true },
]