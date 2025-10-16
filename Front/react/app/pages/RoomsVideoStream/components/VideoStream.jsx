import { use, useRef, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { UserContext } from "../../../data/context.js"
import { getWebSocketDjango } from "../../../modules/getWebSocket.js"
import rememberPage from "../../../modules/rememberPage.js"
import MainComponents from "../../components/MainComponents/MainComponents.jsx"

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

    var frameTimerRef = useRef(null)
    var speakerTimerRef = useRef(null)

    rememberPage(`video_stream/${params.username}/${params.room_id}`)

    useEffect(() => {
        checkCameraAccess()
        connectWebSocket()

        return () => {
            disconnectWebSocket()
            stopStreamingVideo()
            stopStreamingAudio()

            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [params.room_id])

    var checkCameraAccess = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError("Ваш браузер не поддерживает доступ к камере.")
                return
            }

            var permissions = await navigator.permissions.query({ name: "camera" })

            if (permissions.state === "denied") {
                setError("Доступ к камере запрещен.")
            }

        } catch (err) {
            console.warn("Permission API not supported:", err)
        }
    }

    var connectWebSocket = () => {
        try {
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

            webSocketVideo.current.onmessage = (event) => {
                try {
                    var data = JSON.parse(event.data)

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
                            if (delay < 100) {
                                if (currentSpeaker && currentSpeaker.username !== data.user.username) {
                                    clearTimeout(frameTimerRef.current)
                                    frameTimerRef.current = setTimeout(() => {
                                        setCurrentSpeaker(data.user)
                                        displayProcessedFrame(data.frame)
                                    }, 500)
                                } else {
                                    displayProcessedFrame(data.frame)
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

            webSocketAudio.current.onmessage = (event) => {
                try {
                    var data = JSON.parse(event.data)

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
                            if (currentSpeaker && currentSpeaker.username !== data.user.username) {
                                clearTimeout(speakerTimerRef.current)
                                speakerTimerRef.current = setTimeout(() => {
                                    setCurrentSpeaker(data.user)
                                }, 500)
                            } else {
                                setCurrentSpeaker(data.user)
                            }

                            if (user.username !== data.user.username) {
                                playReceivedAudio(data.audio)
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
    }

    var disconnectWebSocket = () => {
        if (webSocketVideo.current) {
            webSocketVideo.current.close(1000, "Page closed")
            webSocketVideo.current = null
        }
        if (webSocketAudio.current) {
            webSocketAudio.current.close(1000, "Page closed")
            webSocketAudio.current = null
        }
    }

    var startStreamingVideo = async () => {
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
                audio: false,
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

    var startStreamingAudio = async () => {
        try {
            setError("")

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("getUserMedia не поддерживается в вашем браузере")
            }

            var stream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: true,
            })

            audioStreamRef.current = stream

            startAudioProcessing(stream)
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

    var stopStreamingVideo = () => {
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
        setCurrentSpeaker(() => null)
    }

    var stopStreamingAudio = () => {
        if (audioProcessorRef.current) {
            audioProcessorRef.current.disconnect()
            audioProcessorRef.current.onaudioprocess = null
            audioProcessorRef.current = null
        }
        if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
        }
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop())
            audioStreamRef.current = null
        }
        setIsSpeaking(false)
        setCurrentSpeaker(() => null)
    }

    var base64EncodeAudio = (audioBuffer) => {
        try {
            // Конвертируем Float32 в Int16
            var array = new Int16Array(audioBuffer.length)
            for (var i = 0; i < audioBuffer.length; i++) {
                var sample = Math.max(-1, Math.min(1, audioBuffer[i]))
                array[i] = sample * 0x7FFF
            }

            // Конвертируем Int16Array в base64 правильно
            var binaryString = new Uint8Array(array.buffer)
            return btoa(String.fromCharCode.apply(null, binaryString))
        } catch (error) {
            console.error("Error encoding audio:", error)
            return ""
        }
    }

    var base64DecodeAudio = (base64Data) => {
        try {
            var binaryString = atob(base64Data)
            var bytes = new Uint8Array(binaryString.length)
            var i
            for (i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
            }

            // Конвертируем обратно в Int16, затем в Float32
            var int16Array = new Int16Array(bytes.buffer)
            var floatBuffer = new Float32Array(int16Array.length)
            for (i = 0; i < int16Array.length; i++) {
                floatBuffer[i] = int16Array[i] / 0x7FFF
            }

            return floatBuffer
        } catch (error) {
            console.error("Error decoding audio:", error)
            return new Float32Array(0)
        }
    }

    var startAudioProcessing = (stream) => {
        try {
            console.log("Starting audio processing...")

            // Создаем AudioContext
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
            console.log("AudioContext created")

            // Проверяем, есть ли аудиотреки
            if (!stream.getAudioTracks().length) {
                console.error("No audio tracks in stream")
                return
            }

            var source = audioContextRef.current.createMediaStreamSource(stream)
            console.log("MediaStreamSource created")

            audioProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1)
            console.log("ScriptProcessorNode created")

            audioProcessorRef.current.onaudioprocess = (event) => {
                if (isAudioStreaming && webSocketAudio.current.readyState === WebSocket.OPEN) {
                    var audioData = event.inputBuffer.getChannelData(0)

                    // Расчет уровня звука
                    var sum = 0
                    for (var i = 0; i < audioData.length; i++) {
                        sum += Math.abs(audioData[i])
                    }
                    var level = sum / audioData.length
                    setAudioLevel(level)

                    // Отправка только если звук выше порога
                    if (level > 0.005) {
                        var encoded = base64EncodeAudio(audioData)
                        if (encoded) {
                            setIsSpeaking(true)
                            try {
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
                            } catch (sendError) {
                                console.error("Error sending audio:", sendError)
                            }
                        }
                    } else {
                        setIsSpeaking(false)
                    }
                }
            }

            source.connect(audioProcessorRef.current)
            audioProcessorRef.current.connect(audioContextRef.current.destination)
            console.log("Audio processing started successfully")

        } catch (error) {
            console.error("Error starting audio processing:", error)
            setIsSpeaking(false)
        }
    }

    var playReceivedAudio = (audioData) => {
        var audioContext = new (window.AudioContext || window.webkitAudioContext)()
        var decodedData = base64DecodeAudio(audioData)

        var buffer = audioContext.createBuffer(1, decodedData.length, audioContext.sampleRate)
        buffer.copyToChannel(decodedData, 0)

        var source = audioContext.createBufferSource()
        source.buffer = buffer
        source.connect(audioContext.destination)
        source.start()
    }

    var captureAndSendFrames = () => {
        if (!isStreaming || !webSocketVideo.current || webSocketVideo.current.readyState !== WebSocket.OPEN || !isSpeaking) {
            return
        }

        var video = videoRef.current
        var canvas = canvasRef.current
        var canvasModal = canvasModalRef.current

        if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
            animationRef.current = requestAnimationFrame(captureAndSendFrames)
            return
        }

        var context
        var frameData
        if (isFullscreen && canvasModal) {
            context = canvasModal.getContext("2d")
            canvasModal.width = video.videoWidth
            canvasModal.height = video.videoHeight
            context.drawImage(video, 0, 0, canvasModal.width, canvasModal.height)
            frameData = canvasModal.toDataURL("image/jpeg", 0.7)
        } else {
            context = canvas.getContext("2d")
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            context.drawImage(video, 0, 0, canvas.width, canvas.height)
            frameData = canvas.toDataURL("image/jpeg", 0.7)
        }

        try {
            webSocketVideo.current.send(JSON.stringify({
                type: "video_frame",
                frame: frameData,
                room: params.room_id,
                user: user,
                active_users: activeUsers,
                is_speaking: isSpeaking,
                current_speaker: currentSpeaker,
                timestamp: Date.now(),
            }))
        } catch (err) {
            console.error("Error sending frame:", err)
        }

        // Ограничиваем FPS для уменьшения нагрузки
        setTimeout(() => {
            if (isStreaming && isSpeaking) {
                animationRef.current = requestAnimationFrame(captureAndSendFrames)
            }
        }, 100) // ~10 FPS
    }

    useEffect(() => {
        if (isStreaming && isSpeaking && isAudioStreaming) {
            animationRef.current = requestAnimationFrame(captureAndSendFrames)
        } else {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
                animationRef.current = null
            }
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
                animationRef.current = null
            }
        }
    }, [isStreaming, isSpeaking, isAudioStreaming])

    var displayProcessedFrame = (frameData) => {
        var img = new Image()
        img.onload = () => {
            var mainContext
            if (isFullscreen && canvasModalRef.current) {
                mainContext = canvasModalRef.current.getContext("2d")
                mainContext.clearRect(0, 0, canvasModalRef.current.width, canvasModalRef.current.height)
                mainContext.drawImage(img, 0, 0, canvasModalRef.current.width, canvasModalRef.current.height)
            } else {
                if (canvasRef.current) {
                    mainContext = canvasRef.current.getContext("2d")
                    mainContext.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                    mainContext.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height)
                }
            }
        }
        img.onerror = () => {
            console.error("Error loading broadcast image")
        }
        img.src = frameData
    }

    useEffect(() => {
        let speakerTimeout

        if (currentSpeaker) {
            // Сбрасываем спикера через 3 секунды без активности
            speakerTimeout = setTimeout(() => {
                setCurrentSpeaker(null)
            }, 3000)
        }

        return () => {
            if (speakerTimeout) {
                clearTimeout(speakerTimeout)
            }
        }
    }, [currentSpeaker])

    var retryConnection = () => {
        setError("")
        disconnectWebSocket()
        setTimeout(() => {
            connectWebSocket()
        }, 1000)
    }

    useEffect(() => {
        if (isAudioStreaming) {
            if (!audioStreamRef.current) {
                startStreamingAudio()
            }
        } else {
            stopStreamingAudio()
        }
    }, [isAudioStreaming])

    useEffect(() => {
        disconnectWebSocket()
        connectWebSocket()
    }, [params.room_id])

    useEffect(() => {
        return () => {
            if (frameTimerRef.current) {
                clearTimeout(frameTimerRef.current)
            }
            if (speakerTimerRef.current) {
                clearTimeout(speakerTimerRef.current)
            }
        }
    }, [])

    return (
        <>
            <MainComponents />

            {isFullscreen && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    backgroundColor: "black",
                    zIndex: 9999,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                }}>
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
            )}

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
                            onClick={() => startStreamingVideo()}
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
                            onClick={() => stopStreamingVideo()}
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
                            onClick={() => {
                                setIsAudioStreaming((prev) => !prev)
                            }}
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
                            onClick={() => {
                                setIsFullscreen((prev) => !prev)
                            }}
                            style={{
                                margin: "5px",
                                padding: "12px 24px",
                                backgroundColor: "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                cursor: "pointer",
                                fontSize: "16px"
                            }}
                        >
                            На весь экран
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
                            {
                                activeUsers.length === 0 && "Ожидание трансляций от других пользователей"
                            }
                        </div>
                        <div style={{ marginTop: "10px", color: "#666" }}>
                            {
                                currentSpeaker !== null && `${currentSpeaker.first_name} ${currentSpeaker.last_name} @${currentSpeaker.username}`
                            }
                        </div>
                        {
                            isAudioStreaming &&

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
                        }
                    </div>
                </div>

                <canvas style={{ display: "none" }} />
                {
                    activeUsers.length > 0
                    && <>
                        <br />
                        <br />
                        <br />
                        <h3>Список подключенных пользователей</h3>
                        {
                            activeUsers.map((username) => {
                                return <div key={username}>@{username}</div>
                            })
                        }
                    </>
                }
            </div>
        </>
    )
}