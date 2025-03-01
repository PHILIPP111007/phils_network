export default function showOnlineStatus({ user }) {
    if (user.is_online) {
        return <div className="onlineStatus">online</div>
    } else {
        return
    }
}