// Функция для преобразования ArrayBuffer в Base64 без переполнения стека
export function arrayBufferToBase64(buffer) {
    var bytes = new Uint8Array(buffer)
    var binary = ""
    var chunkSize = 8192 // Оптимальный размер чанка для производительности

    for (let i = 0; i < bytes.length; i += chunkSize) {
        var chunk = bytes.subarray(i, i + chunkSize)
        binary += String.fromCharCode.apply(null, chunk)
    }

    return btoa(binary)
}

// Функция для преобразования Base64 в ArrayBuffer (обратная операция)
export function base64ToArrayBuffer(base64) {
    var binaryString = atob(base64)
    var bytes = new Uint8Array(binaryString.length)

    // Заполняем массив байтов посимвольно
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }

    return bytes.buffer
}