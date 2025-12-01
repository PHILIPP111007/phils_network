import { arrayBufferToBase64, base64ToArrayBuffer } from "./array.js"

export async function generateKey(seed) {
    const encoder = new TextEncoder()
    const seedData = encoder.encode(seed)

    // Просто хешируем сид и используем как ключ
    const hash = await crypto.subtle.digest("SHA-256", seedData)
    const keyData = hash.slice(0, 32)  // Берем первые 32 байта для AES-256

    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    )

    return cryptoKey
}

export async function encrypt(data, key) {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        new TextEncoder().encode(data)
    )
    return btoa(String.fromCharCode(...iv, ...new Uint8Array(encrypted)))
}

export async function decrypt(encryptedData, key) {
    const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
    const iv = data.slice(0, 12)
    const encrypted = data.slice(12)

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encrypted
    )
    return new TextDecoder().decode(decrypted)
}

// Функция шифрования
export async function encryptLargeData(data, key) {
    try {
        const iv = crypto.getRandomValues(new Uint8Array(12))

        // Определяем тип данных и преобразуем в ArrayBuffer
        let dataBytes
        if (typeof data === "string") {
            dataBytes = new TextEncoder().encode(data)
        } else if (data instanceof ArrayBuffer) {
            dataBytes = data
        } else if (ArrayBuffer.isView(data)) { // Uint8Array, DataView и т.д.
            dataBytes = data.buffer
        } else if (data instanceof Blob || data instanceof File) {
            dataBytes = await data.arrayBuffer()
        } else {
            throw new Error("Unsupported data type")
        }

        // Шифруем данные
        const encrypted = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv,
                tagLength: 128 // Дополнительно указываем размер тега аутентификации
            },
            key,
            dataBytes
        )

        // Создаем общий массив: IV (12 байт) + зашифрованные данные
        const ivArray = new Uint8Array(iv)
        const encryptedArray = new Uint8Array(encrypted)
        const totalArray = new Uint8Array(ivArray.length + encryptedArray.length)

        totalArray.set(ivArray, 0)
        totalArray.set(encryptedArray, ivArray.length)

        // Преобразуем в base64
        return arrayBufferToBase64(totalArray.buffer)

    } catch (error) {
        console.error("Encryption error:", error)
        throw error
    }
}

// Функция дешифрования
export async function decryptLargeData(encryptedData, key) {
    try {
        // Преобразуем base64 обратно в ArrayBuffer
        const dataBuffer = base64ToArrayBuffer(encryptedData)
        const data = new Uint8Array(dataBuffer)

        // Извлекаем IV (первые 12 байт) и зашифрованные данные
        const iv = data.slice(0, 12)
        const encrypted = data.slice(12)

        // Дешифруем данные
        const decrypted = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv,
                tagLength: 128
            },
            key,
            encrypted
        )

        // Пытаемся декодировать как текст, если это не получается - возвращаем ArrayBuffer
        try {
            return new TextDecoder().decode(decrypted)
        } catch (textError) {
            // Если это не текст (например, изображение), возвращаем ArrayBuffer
            return decrypted
        }

    } catch (error) {
        console.error("Decryption error:", error)

        // Более информативные ошибки
        if (error.name === "OperationError" || error.name === "TypeError") {
            throw new Error("Decryption failed. Possible reasons: wrong key, corrupted data, or wrong IV.")
        }
        throw error
    }
}