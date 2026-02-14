import toast from "react-hot-toast"

export var notify = (msg) => toast(msg)

export var notify_success = (msg) => toast.success(msg)
export var notify_error = (msg) => toast.error(msg)