export async function generateKey(seed) {
    const encoder = new TextEncoder()
    const seedData = encoder.encode(seed)

    // Просто хешируем сид и используем как ключ
    const hash = await crypto.subtle.digest('SHA-256', seedData)
    const keyData = hash.slice(0, 32)  // Берем первые 32 байта для AES-256

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
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