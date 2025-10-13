import { use, useRef, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { UserContext } from "../../../data/context.js"
import { getWebSocketDjango } from "../../../modules/getWebSocket.js"
import rememberPage from "../../../modules/rememberPage.js"
import MainComponents from "../../components/MainComponents/MainComponents.jsx"

export default function VideoStream() {

    var { user } = use(UserContext)
    var params = useParams()
    var videoRef = useRef(null)
    var canvasRef = useRef(null)
    var ws = useRef(null)
    var [isConnected, setIsConnected] = useState(false)
    var [isStreaming, setIsStreaming] = useState(false)
    var [error, setError] = useState("")
    var [cameraAccess, setCameraAccess] = useState(false)
    var [activeUsers, setActiveUsers] = useState([])
    var streamRef = useRef(null)
    var animationRef = useRef(null)

    rememberPage(`video_stream/${params.username}/${params.room_id}`)

    useEffect(() => {
        checkCameraAccess()
        connectWebSocket()

        return () => {
            disconnectWebSocket()
            stopStreaming()
        }
    }, [])

    var checkCameraAccess = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError("Ваш браузер не поддерживает доступ к камере.")
                setCameraAccess(false)
                return
            }

            var permissions = await navigator.permissions.query({ name: "camera" })
            setCameraAccess(permissions.state !== "denied")

            if (permissions.state === "denied") {
                setError("Доступ к камере запрещен.")
            }

        } catch (err) {
            console.warn("Permission API not supported:", err)
            setCameraAccess(true)
        }
    }

    var connectWebSocket = () => {
        try {
            ws.current = getWebSocketDjango({
                socket_name: "videoStreamSocket",
                path: `video_stream/${params.room_id}/`,
                setIsConnected: setIsConnected
            })

            ws.current.onmessage = (event) => {
                try {
                    var data = JSON.parse(event.data)

                    if (data.type === "broadcast_frame") {
                        // Получаем кадр от другого пользователя
                        displayProcessedFrame(data.frame, data.user)

                        // Обновляем список активных пользователей
                        setActiveUsers(prev => {
                            var users = new Set(prev)
                            users.add(user.username)
                            return Array.from(users)
                        })
                        setActiveUsers(prev => {
                            var users = new Set(prev)
                            users.add(data.user.username)
                            return Array.from(users)
                        })

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
    }

    var disconnectWebSocket = () => {
        if (ws.current) {
            ws.current.close(1000, "Page closed")
        }
    }

    var startStreaming = async () => {
        try {
            setError("")

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("getUserMedia не поддерживается в вашем браузере")
            }

            var stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 15, max: 30 }
                },
                audio: false
            })

            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream

                setIsStreaming(true)
            }

        } catch (error) {
            console.error("Error accessing camera:", error)
            let errorMessage = "Не удалось получить доступ к камере. "

            if (error.name === "NotAllowedError") {
                errorMessage += "Доступ к камере запрещен."
            } else if (error.name === "NotFoundError") {
                errorMessage += "Камера не найдена."
            } else {
                errorMessage += error.message
            }

            setError(errorMessage)
        }
    }

    var stopStreaming = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop()
            })
            streamRef.current = null
        }

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
            animationRef.current = null
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null
        }

        setIsStreaming(false)
    }

    var captureAndSendFrames = () => {
        if (isStreaming === true && ws.current.readyState === WebSocket.OPEN) {
            var video = videoRef.current
            var canvas = canvasRef.current

            var context = canvas.getContext("2d")

            canvas.width = video.videoWidth
            canvas.height = video.videoHeight

            context.drawImage(video, 0, 0, canvas.width, canvas.height)

            var frameData = canvas.toDataURL("image/jpeg", 0.7)

            try {
                ws.current.send(JSON.stringify({
                    type: "video_frame",
                    frame: frameData,
                    room: params.room_id,
                    user: user,
                    active_users: activeUsers,
                }))
            } catch (err) {
                console.error("Error sending frame:", err)
            }

            // Ограничиваем FPS для уменьшения нагрузки
            setTimeout(() => {
                animationRef.current = requestAnimationFrame(captureAndSendFrames)
            }, 100) // ~10 FPS
        }
    }

    var displayProcessedFrame = (frameData, user) => {
        var img = new Image()
        img.onload = () => {
            if (canvasRef.current) {
                var mainContext = canvasRef.current.getContext("2d")
                mainContext.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                mainContext.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height)

                // Добавляем идентификатор пользователя на canvas
                mainContext.fillStyle = "white"
                mainContext.font = "16px Arial"
                mainContext.fillText(`${user.first_name} ${user.last_name} @${user.username}`, 10, 30)
            }
        }
        img.onerror = () => {
            console.error("Error loading broadcast image")
        }
        img.src = frameData
    }

    var retryConnection = () => {
        setError("")
        disconnectWebSocket()
        setTimeout(() => {
            connectWebSocket()
        }, 1000)
    }

    useEffect(() => {
        if (isStreaming === true) {
            captureAndSendFrames()
        }
    }, [isStreaming])

    return (
        <>
            <MainComponents />

            <div style={{ padding: "100px", textAlign: "center", maxWidth: "1200px", margin: "0 auto" }}>
                {error && (
                    <div style={{
                        padding: "15px",
                        margin: "20px 0",
                        backgroundColor: "#ffebee",
                        border: "1px solid #f44336",
                        borderRadius: "5px",
                        color: "#c62828"
                    }}>
                        {error}
                        <br />
                        <button
                            onClick={retryConnection}
                            style={{
                                marginTop: "10px",
                                padding: "8px 16px",
                                backgroundColor: "#f44336",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer"
                            }}
                        >
                            Попробовать снова
                        </button>
                    </div>
                )}

                {/* Статистика */}
                <div style={{
                    marginBottom: "20px",
                    padding: "15px",
                    backgroundColor: "#e3f2fd",
                    borderRadius: "10px"
                }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
                        <div>Камера: <strong>{isStreaming ? "✅ Активна" : "❌ Неактивна"}</strong></div>
                        <div>Активных пользователей: <strong>{activeUsers.length}</strong></div>
                    </div>
                </div>

                {/* Панель управления */}
                <div style={{
                    marginBottom: "20px",
                    padding: "20px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "10px"
                }}>
                    <div style={{ marginBottom: "15px" }}>
                        <button
                            onClick={() => startStreaming()}
                            disabled={!isConnected || isStreaming}
                            style={{
                                margin: "5px",
                                padding: "12px 24px",
                                backgroundColor: isStreaming ? "#ccc" : "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                cursor: isStreaming ? "not-allowed" : "pointer",
                                fontSize: "16px"
                            }}
                        >
                            ▶️ Начать трансляцию
                        </button>

                        <button
                            onClick={stopStreaming}
                            disabled={!isStreaming}
                            style={{
                                margin: "5px",
                                padding: "12px 24px",
                                backgroundColor: isStreaming ? "#dc3545" : "#ccc",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                cursor: isStreaming ? "pointer" : "not-allowed",
                                fontSize: "16px"
                            }}
                        >
                            ⏹️ Остановить
                        </button>
                    </div>
                </div>

                {/* Видео панель */}
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "30px",
                    flexWrap: "wrap",
                    marginTop: "20px"
                }}>
                    <div style={{ textAlign: "center" }}>
                        <h3>Мое видео (исходное)</h3>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{
                                width: "100%",
                                maxWidth: "400px",
                                height: "300px",
                                border: "3px solid #007bff",
                                borderRadius: "10px",
                                backgroundColor: "#000"
                            }}
                        />
                    </div>

                    <div style={{ textAlign: "center" }}>
                        <h3>Трансляция (от других пользователей)</h3>
                        <canvas
                            ref={canvasRef}
                            style={{
                                width: "100%",
                                maxWidth: "400px",
                                height: "300px",
                                border: "3px solid #28a745",
                                borderRadius: "10px",
                                backgroundColor: "#000"
                            }}
                        />
                        <div style={{ marginTop: "10px", color: "#666" }}>
                            {activeUsers.length > 0
                                ? `Получаем видео от ${activeUsers.length} пользователей`
                                : "Ожидание трансляций от других пользователей"
                            }
                        </div>
                    </div>
                </div>

                <canvas style={{ display: "none" }} />
            </div>
        </>
    )
}