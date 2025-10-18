export var disconnectStreamWebSocket = async ({ webSocketVideo, webSocketAudio }) => {
    if (webSocketVideo.current) {
        webSocketVideo.current.close(1000, "Page closed")
        webSocketVideo.current = null
    }
    if (webSocketAudio.current) {
        webSocketAudio.current.close(1000, "Page closed")
        webSocketAudio.current = null
    }
}