export function getFileUrl(file_content) {
    var blob
    var uint8Array
    var url
    var byteCharacters
    var byteNumbers

    try {
        byteCharacters = atob(file_content)
        byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        uint8Array = new Uint8Array(byteNumbers)
        blob = new Blob([uint8Array], { type: 'application/octet-stream' })
        url = URL.createObjectURL(blob)
    } catch {
        uint8Array = new Uint8Array(file_content)
        blob = new Blob([uint8Array], { type: 'application/octet-stream' })
        url = URL.createObjectURL(blob)
    }

    return url
}