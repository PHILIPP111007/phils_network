import { use, useRef, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { UserContext } from "../../../data/context.js"
import rememberPage from "../../../modules/rememberPage.js"
import MainComponents from "../../components/MainComponents/MainComponents.jsx"
import { getWebSocketDjango } from "../../../modules/getWebSocket.js"

export default function VideoStream() {
    var { user } = use(UserContext)
    var [currentSpeaker, setCurrentSpeaker] = useState(null)
    var [isSpeaking, setIsSpeaking] = useState(false)

    var params = useParams()
    var videoRef = useRef(null)
    var canvasRef = useRef(null)
    var canvasModalRef = useRef(null)
    var [isFullscreen, setIsFullscreen] = useState(false)
    var webSocketVideo = useRef(null)
    var webSocketAudio = useRef(null)
    var [isConnected, setIsConnected] = useState(false)
    var [isStreaming, setIsStreaming] = useState(false)
    var [error, setError] = useState("")
    var [activeUsers, setActiveUsers] = useState([])
    var streamRef = useRef(null)
    var animationRef = useRef(null)

    var [isAudioStreaming, setIsAudioStreaming] = useState(false)
    var [audioLevel, setAudioLevel] = useState(0)
    var audioContextRef = useRef(null)
    var audioStreamRef = useRef(null)
    var audioProcessorRef = useRef(null)

    rememberPage(`video_stream/${params.username}/${params.room_id}`)

    // Встроенные функции вместо модулей
    var checkCameraAccess = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError("Ваш браузер не поддерживает доступ к камере.")
                return false
            }
            return true
        } catch (err) {
            console.error("Camera access error:", err)
            setError("Ошибка доступа к камере")
            return false
        }
    }

    var startStreamingVideo = async () => {
        try {
            setError("")
            console.log("Starting video streaming...")

            var hasAccess = await checkCameraAccess()
            if (!hasAccess) {
                return
            }

            var stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 15, max: 30 }
                },
                audio: false,
            })

            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                console.log("Video stream started")
            }
        } catch (error) {
            console.error("Error accessing camera:", error)
            var errorMessage = "Не удалось получить доступ к камере. "
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

    var stopStreamingVideo = async () => {
        console.log("Stopping video streaming...")
        if (streamRef.current) {
            await streamRef.current.getTracks().forEach(track => {
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
        setCurrentSpeaker(null)
    }

    var startStreamingAudio = async () => {
        try {
            setError("")
            console.log("Starting audio streaming...")

            var hasAccess = await checkCameraAccess()
            if (!hasAccess) {
                return
            }

            var stream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000, // добавляем конкретные настройки
                    channelCount: 1
                },
            })

            audioStreamRef.current = stream
            await startAudioProcessing(stream)

        } catch (error) {
            console.error("Error accessing microphone:", error)
            var errorMessage = "Не удалось получить доступ к микрофону. "
            if (error.name === "NotAllowedError") {
                errorMessage += "Доступ к микрофону запрещен."
            } else if (error.name === "NotFoundError") {
                errorMessage += "Микрофон не найден."
            } else {
                errorMessage += error.message
            }
            setError(errorMessage)
            setIsAudioStreaming(false)
        }
    }

    var stopStreamingAudio = async () => {
        console.log("Stopping audio streaming...")

        // Очищаем интервал проверки
        if (audioContextRef.current && audioContextRef.current._checkInterval) {
            clearInterval(audioContextRef.current._checkInterval)
        }

        if (audioProcessorRef.current) {
            audioProcessorRef.current.disconnect()
            audioProcessorRef.current = null
        }

        if (audioContextRef.current) {
            try {
                await audioContextRef.current.close()
            } catch (error) {
                console.error("Error closing audio context:", error)
            }
            audioContextRef.current = null
        }

        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop())
            audioStreamRef.current = null
        }

        setIsSpeaking(false)
        setCurrentSpeaker(null)
        setAudioLevel(0)
    }

    var encodeAudio = (audioData) => {
        try {
            var array = new Uint8Array(audioData.length)
            for (var i = 0; i < audioData.length; i++) {
                var sample = Math.max(-1, Math.min(1, audioData[i]))
                array[i] = Math.floor((sample + 1) * 127)
            }
            var binaryString = String.fromCharCode.apply(null, array)
            return btoa(binaryString)
        } catch (error) {
            console.error("Error encoding audio:", error)
            return ""
        }
    }

    var decodeAudio = (base64Data) => {
        try {
            var binaryString = atob(base64Data)
            var array = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
                array[i] = binaryString.charCodeAt(i)
            }
            var floatBuffer = new Float32Array(array.length)
            for (let i = 0; i < array.length; i++) {
                floatBuffer[i] = (array[i] / 127) - 1
            }
            return floatBuffer
        } catch (error) {
            console.error("Error decoding audio:", error)
            return new Float32Array(0)
        }
    }

    var playReceivedAudio = async (audioData) => {
        try {
            var audioContext = new (window.AudioContext || window.webkitAudioContext)()
            var decodedData = decodeAudio(audioData)
            var buffer = audioContext.createBuffer(1, decodedData.length, audioContext.sampleRate)
            buffer.copyToChannel(decodedData, 0)
            var source = audioContext.createBufferSource()
            source.buffer = buffer
            source.connect(audioContext.destination)
            source.start()
        } catch (error) {
            console.error("Error playing audio:", error)
        }
    }

    var displayProcessedFrame = async (frameData) => {
        var img = new Image()
        img.onload = async () => {
            if (canvasRef.current) {
                var mainContext = await canvasRef.current.getContext("2d")
                await mainContext.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                await mainContext.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height)
            }
        }
        img.onerror = () => {
            console.error("Error loading broadcast image")
        }
        img.src = frameData
    }

    var restartAudioContext = async () => {
        try {
            console.log("Restarting AudioContext...")

            // Останавливаем текущую обработку
            if (audioProcessorRef.current) {
                audioProcessorRef.current.disconnect()
                audioProcessorRef.current = null
            }

            if (audioContextRef.current) {
                await audioContextRef.current.close()
            }

            // Создаем новый AudioContext
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()

            // Ждем готовности
            if (audioContextRef.current.state === "suspended") {
                await audioContextRef.current.resume()
            }

            console.log("AudioContext restarted successfully")
            return true
        } catch (error) {
            console.error("Error restarting AudioContext:", error)
            return false
        }
    }

    var startAudioProcessing = async (stream) => {
        try {
            console.log("Starting audio processing...")

            // Перезапускаем AudioContext
            var success = await restartAudioContext()
            if (!success) {
                throw new Error("Failed to initialize AudioContext")
            }

            var source = audioContextRef.current.createMediaStreamSource(stream)
            audioProcessorRef.current = audioContextRef.current.createScriptProcessor(16384, 1, 1)

            var errorCount = 0
            var MAX_ERRORS = 3

            audioProcessorRef.current.onaudioprocess = (event) => {
                if (!isAudioStreaming || !webSocketAudio.current || webSocketAudio.current.readyState !== WebSocket.OPEN) {
                    return
                }

                try {
                    // Проверяем состояние AudioContext
                    if (audioContextRef.current.state !== "running") {
                        console.log("AudioContext not running, state:", audioContextRef.current.state)
                        if (errorCount < MAX_ERRORS) {
                            errorCount++
                            audioContextRef.current.resume().catch(console.error)
                        }
                        return
                    }

                    var audioData = event.inputBuffer.getChannelData(0)
                    var sum = 0
                    for (var i = 0; i < audioData.length; i++) {
                        sum += Math.abs(audioData[i])
                    }
                    var level = sum / audioData.length
                    setAudioLevel(level)

                    if (level > 0.01) {
                        setIsSpeaking(true)
                        var encoded = encodeAudio(audioData)
                        if (encoded && webSocketAudio.current.readyState === WebSocket.OPEN) {
                            webSocketAudio.current.send(JSON.stringify({
                                type: "audio_data",
                                audio: encoded,
                                room: params.room_id,
                                user: user,
                                active_users: activeUsers,
                                is_speaking: true,
                                current_speaker: user,
                                timestamp: Date.now(),
                            }))
                        }
                        errorCount = 0 // сбрасываем счетчик ошибок при успешной обработке
                    } else {
                        setIsSpeaking(false)
                    }
                } catch (error) {
                    console.error("Error in audio processing:", error)
                    errorCount++
                    setIsSpeaking(false)

                    // Если много ошибок подряд, перезапускаем AudioContext
                    if (errorCount >= MAX_ERRORS) {
                        console.log("Too many errors, restarting AudioContext...")
                        setTimeout(() => {
                            if (isAudioStreaming && audioStreamRef.current) {
                                restartAudioContext().then(success => {
                                    if (success && audioStreamRef.current) {
                                        var source = audioContextRef.current.createMediaStreamSource(audioStreamRef.current)
                                        source.connect(audioProcessorRef.current)
                                    }
                                })
                            }
                        }, 100)
                    }
                }
            }

            source.connect(audioProcessorRef.current)
            audioProcessorRef.current.connect(audioContextRef.current.destination)
            console.log("Audio processing started successfully")

        } catch (error) {
            console.error("Error starting audio processing:", error)
            setError("Ошибка инициализации аудио: " + error.message)
            setIsSpeaking(false)
            setIsAudioStreaming(false)
        }
    }

    var captureAndSendFrames = async () => {
        if (!isStreaming || !webSocketVideo.current || webSocketVideo.current.readyState !== WebSocket.OPEN) {
            animationRef.current = null
            return
        }

        var video = videoRef.current
        var canvas = canvasRef.current
        var canvasModal = canvasModalRef.current

        if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
            animationRef.current = requestAnimationFrame(captureAndSendFrames)
            return
        }

        try {
            var context, frameData

            if (isFullscreen && canvasModal) {
                context = await canvasModal.getContext("2d")
                canvasModal.width = video.videoWidth
                canvasModal.height = video.videoHeight
                await context.drawImage(video, 0, 0, canvasModal.width, canvasModal.height)
                frameData = await canvasModal.toDataURL("image/jpeg", 0.7)
            } else {
                context = await canvas.getContext("2d")
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                await context.drawImage(video, 0, 0, canvas.width, canvas.height)
                frameData = await canvas.toDataURL("image/jpeg", 0.7)
            }

            if (webSocketVideo.current.readyState === WebSocket.OPEN) {
                await webSocketVideo.current.send(JSON.stringify({
                    type: "video_frame",
                    frame: frameData,
                    room: params.room_id,
                    user: user,
                    active_users: activeUsers,
                    is_speaking: isSpeaking,
                    current_speaker: currentSpeaker,
                    timestamp: Date.now(),
                }))
            }
        } catch (err) {
            console.error("Error sending frame:", err)
        }

        setTimeout(() => {
            animationRef.current = requestAnimationFrame(captureAndSendFrames)
        }, 100) // ~10 FPS
    }

    var connectStreamWebSocket = async () => {
        try {
            console.log("Connecting WebSocket...")

            webSocketVideo.current = getWebSocketDjango({
                socket_name: "videoStreamSocket",
                path: `video_stream/${params.room_id}/`,
                setIsConnected: setIsConnected
            })
            webSocketAudio.current = getWebSocketDjango({
                socket_name: "audioStreamSocket",
                path: `audio_stream/${params.room_id}/`,
                setIsConnected: setIsConnected
            })

            webSocketVideo.current.onmessage = async (event) => {
                try {
                    var data = await JSON.parse(event.data)

                    if (data.type === "broadcast_frame") {
                        var delay = Number(Date.now() - data.timestamp)
                        if (delay < 1000) {
                            await displayProcessedFrame(data.frame)
                            setCurrentSpeaker(data.user)
                        }
                    } else if (data.type === "error") {
                        setError(`Server error: ${data.message}`)
                    }
                } catch (err) {
                    console.error("Error parsing video message:", err)
                }
            }

            webSocketAudio.current.onmessage = async (event) => {
                try {
                    var data = await JSON.parse(event.data)

                    if (data.type === "broadcast_audio") {
                        if (data.user.username !== user.username) {
                            var delay = Number(Date.now() - data.timestamp)
                            if (delay < 1000) {
                                await playReceivedAudio(data.audio)
                            }
                        }
                        setCurrentSpeaker(data.user)
                        setActiveUsers(data.active_users || [])
                    }
                } catch (err) {
                    console.error("Error parsing audio message:", err)
                }
            }

        } catch (err) {
            console.error("Error creating WebSocket:", err)
            setError("Failed to establish connection")
        }
    }

    var disconnectStreamWebSocket = async () => {
        if (webSocketVideo.current) {
            await webSocketVideo.current.close()
            webSocketVideo.current = null
        }
        if (webSocketAudio.current) {
            await webSocketAudio.current.close()
            webSocketAudio.current = null
        }
        setIsConnected(false)
    }

    // Эффекты
    useEffect(() => {
        checkCameraAccess()
        connectStreamWebSocket()

        return () => {
            disconnectStreamWebSocket()
            stopStreamingVideo()
            stopStreamingAudio()
        }
    }, [params.room_id])

    useEffect(() => {
        if (isStreaming) {
            startStreamingVideo()
        } else {
            stopStreamingVideo()
        }
    }, [isStreaming])

    useEffect(() => {
        if (isStreaming && !animationRef.current) {
            animationRef.current = requestAnimationFrame(captureAndSendFrames)
        } else if (animationRef.current && (!isStreaming || !isSpeaking)) {
            cancelAnimationFrame(animationRef.current)
            animationRef.current = null
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
                animationRef.current = null
            }
        }
    }, [isStreaming, isFullscreen])

    useEffect(() => {
        if (isAudioStreaming) {
            startStreamingAudio()
        } else {
            stopStreamingAudio()
        }
    }, [isAudioStreaming])

    useEffect(() => {
        if (!isAudioStreaming) {
            return
        }

        var monitorInterval = setInterval(() => {
            if (audioContextRef.current && audioContextRef.current.state !== "running") {
                console.log("AudioContext state:", audioContextRef.current.state)
                audioContextRef.current.resume().catch(console.error)
            }
        }, 3000) // проверяем реже - каждые 3 секунды

        return () => {
            clearInterval(monitorInterval)
        }
    }, [isAudioStreaming])

    return (
        <>
            <MainComponents />

            {/* Fullscreen модальное окно */}
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    backgroundColor: "black",
                    zIndex: 9999,
                    display: isFullscreen ? "flex" : "none",
                    justifyContent: "center",
                    alignItems: "center"
                }}
            >
                <button
                    onClick={() => setIsFullscreen(false)}
                    style={{
                        position: "absolute",
                        top: "20px",
                        right: "20px",
                        padding: "10px 20px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        zIndex: 10000
                    }}
                >
                    ✕ Закрыть
                </button>
                <canvas
                    ref={canvasModalRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain"
                    }}
                />
            </div>

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
                        <div>Пользователей: <strong>{activeUsers.length}</strong></div>
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
                            onClick={() => setIsStreaming(true)}
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
                            onClick={() => setIsStreaming(false)}
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

                        <button
                            onClick={() => setIsAudioStreaming((prev) => !prev)}
                            style={{
                                margin: "5px",
                                padding: "12px 24px",
                                backgroundColor: isAudioStreaming ? "#dc3545" : "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                cursor: "pointer",
                                fontSize: "16px"
                            }}
                        >
                            {isAudioStreaming ? "🔇 Выкл. аудио" : "🔊 Вкл. аудио"}
                        </button>

                        <button
                            onClick={() => setIsFullscreen(true)}
                            disabled={!isStreaming}
                            style={{
                                margin: "5px",
                                padding: "12px 24px",
                                backgroundColor: isStreaming ? "#007bff" : "#ccc",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                cursor: isStreaming ? "pointer" : "not-allowed",
                                fontSize: "16px"
                            }}
                        >
                            📺 На весь экран
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
                        <h3>Мое видео</h3>
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
                        {isStreaming && <div style={{ color: "green", marginTop: "10px" }}>✅ Трансляция активна</div>}
                    </div>

                    <div style={{ textAlign: "center" }}>
                        <h3>Трансляция от других</h3>
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
                        {currentSpeaker && (
                            <div style={{ marginTop: "10px", color: "#666" }}>
                                {currentSpeaker.first_name} {currentSpeaker.last_name}
                            </div>
                        )}

                        {isAudioStreaming && (
                            <div style={{ marginTop: "10px" }}>
                                Уровень звука:
                                <div style={{
                                    width: "200px",
                                    height: "20px",
                                    backgroundColor: "#ddd",
                                    display: "inline-block",
                                    marginLeft: "10px",
                                    borderRadius: "10px",
                                    overflow: "hidden"
                                }}>
                                    <div style={{
                                        width: `${Math.min(audioLevel * 1000, 100)}%`,
                                        height: "100%",
                                        backgroundColor: audioLevel > 0.01 ? "#4CAF50" : "#f44336",
                                        transition: "width 0.1s"
                                    }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {activeUsers.length > 0 && (
                    <>
                        <br /><br /><br />
                        <h3>Подключенные пользователи</h3>
                        {activeUsers.map((username) => (
                            <div key={username}>@{username}</div>
                        ))}
                    </>
                )}
            </div>
        </>
    )
}