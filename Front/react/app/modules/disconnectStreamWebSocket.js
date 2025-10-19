export var disconnectStreamWebSocket = async ({ webSocketVideo, webSocketAudio }) => {
    if (webSocketVideo.current) {
        await webSocketVideo.current.close(1000, "Page closed")
        webSocketVideo.current = null
    }
    if (webSocketAudio.current) {
        await webSocketAudio.current.close(1000, "Page closed")
        webSocketAudio.current = null
    }
}