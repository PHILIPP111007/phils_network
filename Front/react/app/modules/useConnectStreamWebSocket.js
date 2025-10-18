import { useCallback } from "react"
import { getWebSocketDjango } from "../modules/getWebSocket.js"

export const useConnectStreamWebSocket = ({
    webSocketVideo,
    webSocketAudio,
    setIsConnected,
    room_id,
    setActiveUsers,
    displayProcessedFrame,
    setCurrentSpeaker,
    playReceivedAudio,
    setError,
    user,
    isFullscreen,
    canvasModalRef,
    canvasRef,
    decodeAudio
}) => {
    return useCallback(async () => {
        try {
            webSocketVideo.current = getWebSocketDjango({
                socket_name: "videoStreamSocket",
                path: `video_stream/${room_id}/`,
                setIsConnected: setIsConnected
            })

            webSocketAudio.current = getWebSocketDjango({
                socket_name: "audioStreamSocket",
                path: `audio_stream/${room_id}/`,
                setIsConnected: setIsConnected
            })

            webSocketVideo.current.onmessage = async (event) => {
                try {
                    var data = await JSON.parse(event.data)

                    // Обновляем список активных пользователей
                    setActiveUsers(prev => {
                        var users = new Set(prev)
                        if (data.user && data.user.username) {
                            users.add(data.user.username)
                        }
                        return Array.from(users)
                    })

                    if (data.type === "broadcast_frame") {
                        if (data.is_speaking) {
                            var delay = Number(Date.now() - data.timestamp)
                            if (delay < 500) {
                                await displayProcessedFrame({
                                    frameData: data.frame,
                                    isFullscreen: isFullscreen,
                                    canvasModalRef: canvasModalRef,
                                    canvasRef: canvasRef
                                })
                            }
                        }
                    } else if (data.type === "error") {
                        console.error("Server error:", data.message)
                        setError(`Server error: ${data.message}`)
                    }
                } catch (err) {
                    console.error("Error parsing WebSocket message:", err)
                }
            }

            webSocketAudio.current.onmessage = async (event) => {
                try {
                    var data = await JSON.parse(event.data)

                    // Обновляем список активных пользователей
                    setActiveUsers(prev => {
                        var users = new Set(prev)
                        if (data.user && data.user.username) {
                            users.add(data.user.username)
                        }
                        return Array.from(users)
                    })

                    if (data.type === "broadcast_audio") {
                        if (data.is_speaking) {
                            setCurrentSpeaker(data.user)
                            if (user.username !== data.user.username) {
                                var delay = Number(Date.now() - data.timestamp)
                                if (delay < 500) {
                                    await playReceivedAudio({ audioData: data.audio, decodeAudio: decodeAudio })
                                }
                            }
                        }
                    } else if (data.type === "error") {
                        console.error("Server error:", data.message)
                        setError(`Server error: ${data.message}`)
                    }
                } catch (err) {
                    console.error("Error parsing WebSocket message:", err)
                }
            }
        } catch (err) {
            console.error("Error creating WebSocket:", err)
            setError("Failed to establish WebSocket connection")
        }
    }, [
        isFullscreen, // Основная зависимость
        webSocketVideo,
        webSocketAudio,
        setIsConnected,
        room_id,
        setActiveUsers,
        displayProcessedFrame,
        setCurrentSpeaker,
        playReceivedAudio,
        setError,
        user,
        canvasModalRef,
        canvasRef,
        decodeAudio,
    ])
}