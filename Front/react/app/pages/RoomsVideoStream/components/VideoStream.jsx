import { use, useRef, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { UserContext } from "../../../data/context.js"
import { useConnectStreamWebSocket } from "../../../modules/useConnectStreamWebSocket.js"
import { disconnectStreamWebSocket } from "../../../modules/disconnectStreamWebSocket.js"
import { encodeAudio, decodeAudio } from "../../../modules/encodeAndDecodeAudio.js"
import { playReceivedAudio } from "../../../modules/playReceivedAudio.js"
import { displayProcessedFrame } from "../../../modules/displayProcessedFrame.js"
import { checkCameraAccess } from "../../../modules/checkCameraAccess.js"
import { startStreamingVideo } from "../../../modules/startStreamingVideo.js"
import { startStreamingAudio } from "../../../modules/startStreamingAudio.js"
import { stopStreamingAudio } from "../../../modules/stopStreamingAudio.js"
import { stopStreamingVideo } from "../../../modules/stopStreamingVideo.js"
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

    async function startAudioProcessing(stream) {
        try {
            console.log("Starting audio processing...")

            // Создаем AudioContext в приостановленном состоянии
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()

            // Проверяем, есть ли аудиотреки
            if (!stream.getAudioTracks().length) {
                console.error("No audio tracks in stream")
                return
            }

            var resumeAudioContext = async () => {
                if (audioContextRef.current && audioContextRef.current.state === "suspended") {
                    await audioContextRef.current.resume()
                    console.log("AudioContext resumed")
                }
            }

            // Вызываем резюмирование при создании
            await resumeAudioContext()

            var source = audioContextRef.current.createMediaStreamSource(stream)
            audioProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1)
            audioProcessorRef.current.onaudioprocess = async (event) => {
                if (isAudioStreaming && webSocketAudio.current.readyState === WebSocket.OPEN) {
                    if (audioContextRef.current.state !== "running") {
                        await resumeAudioContext()
                        return
                    }

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
                        var encoded = await encodeAudio(audioData)
                        if (encoded) {
                            setIsSpeaking(true)
                            try {
                                await webSocketAudio.current.send(JSON.stringify({
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
                    }
                }
            }

            source.connect(audioProcessorRef.current)
            audioProcessorRef.current.connect(audioContextRef.current.destination)

        } catch (error) {
            console.error("Error starting audio processing:", error)
            setIsSpeaking(false)
        }
    }

    var captureAndSendFrames = async () => {
        if (!isStreaming || !webSocketVideo.current || webSocketVideo.current.readyState !== WebSocket.OPEN) {
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

    var connectStreamWebSocket = useConnectStreamWebSocket({
        webSocketVideo: webSocketVideo,
        webSocketAudio: webSocketAudio,
        setIsConnected: setIsConnected,
        room_id: params.room_id,
        setActiveUsers: setActiveUsers,
        displayProcessedFrame: displayProcessedFrame,
        setCurrentSpeaker: setCurrentSpeaker,
        playReceivedAudio: playReceivedAudio,
        setError: setError,
        user: user,
        isFullscreen: isFullscreen,
        canvasModalRef: canvasModalRef,
        canvasRef: canvasRef,
        decodeAudio: decodeAudio,
    })

    useEffect(() => {
        disconnectStreamWebSocket({ webSocketVideo: webSocketVideo, webSocketAudio: webSocketAudio })
        checkCameraAccess({ setError: setError })

        return () => {
            disconnectStreamWebSocket({ webSocketVideo: webSocketVideo, webSocketAudio: webSocketAudio })
            stopStreamingVideo({
                streamRef: streamRef,
                animationRef: animationRef,
                videoRef: videoRef,
                setIsStreaming: setIsStreaming,
                setCurrentSpeaker: setCurrentSpeaker
            })
            stopStreamingAudio({
                audioProcessorRef: audioProcessorRef,
                audioContextRef: audioContextRef,
                audioStreamRef: audioStreamRef,
                setIsSpeaking: setIsSpeaking,
                setCurrentSpeaker: setCurrentSpeaker
            })

            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [params.room_id])

    useEffect(() => {
        connectStreamWebSocket()
    }, [connectStreamWebSocket, isFullscreen])

    useEffect(() => {
        if (isStreaming) {
            startStreamingVideo({ setError: setError, videoRef: videoRef, streamRef: streamRef, setIsStreaming: setIsStreaming })
        }
    }, [isStreaming, isFullscreen])

    useEffect(() => {
        if (isStreaming && webSocketVideo.current?.readyState === WebSocket.OPEN) {
            if (!animationRef.current) {
                animationRef.current = requestAnimationFrame(captureAndSendFrames)
            }
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
    }, [isStreaming, isSpeaking, isFullscreen])

    useEffect(() => {
        if (isAudioStreaming && !audioStreamRef.current) {
            startStreamingAudio({ setError: setError, audioStreamRef: audioStreamRef, startAudioProcessing: startAudioProcessing })
        } else if (!isAudioStreaming && audioStreamRef.current) {
            stopStreamingAudio({
                audioProcessorRef: audioProcessorRef,
                audioContextRef: audioContextRef,
                audioStreamRef: audioStreamRef,
                setIsSpeaking: setIsSpeaking,
                setCurrentSpeaker: setCurrentSpeaker
            })
        }
    }, [isAudioStreaming])

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
                        <br />
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
                            onClick={() => startStreamingVideo({ setError: setError, videoRef: videoRef, streamRef: streamRef, setIsStreaming: setIsStreaming })}
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
                            onClick={() => stopStreamingVideo({
                                streamRef: streamRef,
                                animationRef: animationRef,
                                videoRef: videoRef,
                                setIsStreaming: setIsStreaming,
                                setCurrentSpeaker: setCurrentSpeaker
                            })}
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
                                setIsFullscreen(true)
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