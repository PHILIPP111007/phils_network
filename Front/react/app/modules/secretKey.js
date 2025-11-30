import { generateKey, encrypt, decrypt } from "./cryptoUtils.js"

export async function getSecretKeyLocalStorage({ password, room_id }) {
    var key = `room_${room_id}_SECRET_KEY`
    var encryptedData = localStorage.getItem(key)

    var generatedKey = await generateKey(password)
    var secretKey = await decrypt(encryptedData, generatedKey)

    return secretKey
}

export async function setSecretKeyLocalStorage({ password, room_id, value }) {
    var generatedKey = await generateKey(password)
    var encryptedData = await encrypt(value, generatedKey)

    var key = `room_${room_id}_SECRET_KEY`
    localStorage.setItem(key, encryptedData)
}