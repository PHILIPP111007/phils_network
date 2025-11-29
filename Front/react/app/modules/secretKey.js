export function getSecretKeyLocalStorage({ room_id }) {
    var key = `room_${room_id}_SECRET_KEY`
    var secretKey = localStorage.getItem(key)
    return secretKey
}

export function setSecretKeyLocalStorage({ room_id, value }) {
    var key = `room_${room_id}_SECRET_KEY`
    localStorage.setItem(key, value)
}