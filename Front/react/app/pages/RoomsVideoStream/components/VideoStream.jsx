import { use, useRef, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { UserContext } from "../../../data/context.js"
import rememberPage from "../../../modules/rememberPage.js"
import MainComponents from "../../components/MainComponents/MainComponents.jsx"
import { getWebSocketDjango } from "../../../modules/getWebSocket.js"
import { qualitySettings } from "../../../data/qualitySettings.js"

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
    var [isStreaming, setIsStreaming] = useState(false)
    var [isScreenSharing, setIsScreenSharing] = useState(false)
    var [error, setError] = useState("")
    var [activeUsers, setActiveUsers] = useState([])
    var streamRef = useRef(null)
    var animationRef = useRef(null)

    var [isAudioStreaming, setIsAudioStreaming] = useState(false)
    var [audioLevel, setAudioLevel] = useState(0)
    var audioContextRef = useRef(null)
    var audioStreamRef = useRef(null)
    var audioProcessorRef = useRef(null)
    var screenStreamRef = useRef(null)
    var [screenQuality, setScreenQuality] = useState("720p")
    var [compressionQuality, setCompressionQuality] = useState(0.9)

    var [currentFPS, setCurrentFPS] = useState(10)

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

    // Функция для начала трансляции экрана
    var startScreenSharing = async () => {
        try {
            setError("")
            console.log("Starting screen sharing...")

            // Проверяем поддержку API захвата экрана
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                setError("Ваш браузер не поддерживает захват экрана")
                return false
            }

            var quality = qualitySettings[screenQuality]

            // Запрашиваем разрешение на захват экрана
            var screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always",
                    displaySurface: "monitor", // или "browser", "window", "monitor"
                    logicalSurface: false,
                    width: { ideal: quality.width, max: quality.width },
                    height: { ideal: quality.height, max: quality.height },
                    frameRate: { ideal: quality.frameRate, max: 60 },
                    aspectRatio: { ideal: 16 / 9 },
                    resizeMode: "crop-and-scale",
                },
                audio: false,
            })

            screenStreamRef.current = screenStream

            // Обработка события остановки захвата пользователем
            screenStream.getVideoTracks()[0].onended = () => {
                console.log("Screen sharing stopped by user")
                stopScreenSharing()
            }

            // Заменяем видеопоток камеры на поток экрана
            if (videoRef.current) {
                videoRef.current.srcObject = screenStream
            }

            // Обновляем streamRef для использования в captureAndSendFrames
            streamRef.current = screenStream

            console.log("Screen sharing started successfully")
            return true

        } catch (error) {
            console.error("Error starting screen sharing:", error)
            var errorMessage = "Не удалось начать трансляцию экрана. "

            if (error.name === "NotAllowedError") {
                errorMessage += "Доступ к экрану запрещен."
            } else if (error.name === "NotFoundError") {
                errorMessage += "Не удалось выбрать источник для трансляции."
            } else {
                errorMessage += error.message
            }

            setError(errorMessage)
            return false
        }
    }

    // Функция для остановки трансляции экрана
    var stopScreenSharing = async () => {
        console.log("Stopping screen sharing...")

        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop())
            screenStreamRef.current = null
        }

        // Если была активна трансляция, переключаемся обратно на камеру
        if (isStreaming && !isScreenSharing) {
            await startStreamingVideo()
        } else if (videoRef.current) {
            videoRef.current.srcObject = null
        }

        setIsScreenSharing(false)
    }

    // Модифицированная функция начала трансляции видео
    var startStreamingVideo = async () => {
        try {
            setError("")

            // Если активна трансляция экрана, используем ее
            if (isScreenSharing && screenStreamRef.current) {
                streamRef.current = screenStreamRef.current
                if (videoRef.current) {
                    videoRef.current.srcObject = screenStreamRef.current
                }
                return
            }

            var hasAccess = await checkCameraAccess()
            if (!hasAccess) {
                return
            }

            var quality = qualitySettings[screenQuality]

            var constraints = {
                video: {
                    width: { ideal: quality.width, max: quality.width },
                    height: { ideal: quality.height, max: quality.height },
                    frameRate: { ideal: quality.frameRate, max: 60 },
                    facingMode: "user",
                    aspectRatio: { ideal: 16 / 9 },
                    resizeMode: "crop-and-scale",
                },
                audio: false,
            }

            if (navigator.mediaDevices.getSupportedConstraints().frameRate) {
                constraints.video.frameRate = { ideal: quality.frameRate, max: 60 }
            }

            var stream = await navigator.mediaDevices.getUserMedia(constraints)
            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.onloadedmetadata = () => {
                    console.log("Video metadata loaded, dimensions:",
                        videoRef.current.videoWidth, "x", videoRef.current.videoHeight)
                }
            }

            if (stream.getVideoTracks().length > 0) {
                var track = stream.getVideoTracks()[0]
                var capabilities = track.getCapabilities ? track.getCapabilities() : {}
                var settings = track.getSettings ? track.getSettings() : {}

                console.log("Camera capabilities:", capabilities)
                console.log("Current camera settings:", settings)

                if (capabilities.zoom) {
                    try {
                        await track.applyConstraints({
                            advanced: [{ zoom: capabilities.zoom.min }]
                        })
                    } catch (constraintError) {
                        console.log("Cannot apply zoom constraints:", constraintError)
                    }
                }
            }
        } catch (error) {
            console.error("Error accessing camera:", error)
            var errorMessage = "Не удалось получить доступ к камере. "
            if (error.name === "NotAllowedError") {
                errorMessage += "Доступ к камере запрещен."
            } else if (error.name === "NotFoundError") {
                errorMessage += "Камера не найдена."
            } else if (error.name === "OverconstrainedError") {
                errorMessage += "Требуемые настройки камеры недоступны. Попробуйте другие параметры."
                try {
                    var basicStream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false
                    })
                    streamRef.current = basicStream
                    if (videoRef.current) {
                        videoRef.current.srcObject = basicStream
                    }
                    setError("")
                    return
                } catch (basicError) {
                    console.error("Basic camera access also failed:", basicError)
                }
            } else {
                errorMessage += error.message
            }
            setError(errorMessage)
        }
    }

    var stopStreamingVideo = async () => {
        console.log("Stopping video streaming...")

        // Останавливаем только если это не трансляция экрана
        if (!isScreenSharing) {
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

            // Оптимальные настройки аудио для высокого качества
            var audioConstraints = {
                echoCancellation: { ideal: true },
                noiseSuppression: { ideal: true },
                autoGainControl: { ideal: true },
                // Улучшенные настройки качества
                sampleRate: { ideal: 48000, min: 44100 }, // CD качество
                channelCount: { ideal: 1, max: 2 }, // моно или стерео
                sampleSize: { ideal: 16 }, // битность
                // Дополнительные улучшения для Mac
                googEchoCancellation: true,
                googAutoGainControl: true,
                googNoiseSuppression: true,
                googHighpassFilter: true,
                // Экспериментальные настройки (если поддерживаются)
                latency: { ideal: 0.01 },
                volume: { ideal: 1.0 }
            }

            // Проверяем поддержку расширенных настроек
            var supportedConstraints = navigator.mediaDevices.getSupportedConstraints()
            console.log("Supported audio constraints:", supportedConstraints)

            // Убираем неподдерживаемые ограничения
            var finalConstraints = {}
            Object.keys(audioConstraints).forEach(key => {
                if (supportedConstraints[key]) {
                    finalConstraints[key] = audioConstraints[key]
                }
            })

            // Альтернативные настройки для разных браузеров
            var stream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: finalConstraints
            }).catch(async (error) => {
                console.log("High quality audio failed, trying basic settings:", error)

                // Резервные настройки
                return await navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: 44100,
                        channelCount: 1
                    }
                })
            })

            // Проверяем и логируем фактические настройки
            var audioTrack = stream.getAudioTracks()[0]
            if (audioTrack && audioTrack.getSettings) {
                var actualSettings = audioTrack.getSettings()
                console.log("Actual audio settings:", actualSettings)

                // Проверяем качество
                var capabilities = audioTrack.getCapabilities ? audioTrack.getCapabilities() : {}
                console.log("Audio capabilities:", capabilities)
            }

            audioStreamRef.current = stream
            await startAudioProcessing(stream)

            console.log("High quality audio streaming started")

        } catch (error) {
            console.error("Error accessing microphone:", error)
            var errorMessage = "Не удалось получить доступ к микрофону. "
            if (error.name === "NotAllowedError") {
                errorMessage += "Доступ к микрофону запрещен."
            } else if (error.name === "NotFoundError") {
                errorMessage += "Микрофон не найден."
            } else if (error.name === "OverconstrainedError") {
                errorMessage += "Требуемые настройки микрофона недоступны. Попробуйте базовые настройки."
                // Пробуем минимальные настройки
                try {
                    var basicStream = await navigator.mediaDevices.getUserMedia({
                        video: false,
                        audio: true // Минимальные настройки
                    })
                    audioStreamRef.current = basicStream
                    await startAudioProcessing(basicStream)
                    setError("") // Очищаем ошибку
                    return
                } catch (basicError) {
                    console.error("Basic microphone access also failed:", basicError)
                }
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
            var mainContext, modalContext

            if (canvasRef.current) {
                mainContext = await canvasRef.current.getContext("2d", {
                    alpha: false,
                    desynchronized: true
                })

                // Устанавливаем точные размеры без масштабирования
                var displayWidth = img.naturalWidth
                var displayHeight = img.naturalHeight

                // Обновляем размеры canvas только если они изменились
                if (canvasRef.current.width !== displayWidth || canvasRef.current.height !== displayHeight) {
                    canvasRef.current.width = displayWidth
                    canvasRef.current.height = displayHeight
                }

                // Настраиваем высокое качество рендеринга
                mainContext.imageSmoothingEnabled = true
                mainContext.imageSmoothingQuality = "high"

                // Очищаем и рисуем без масштабирования
                await mainContext.clearRect(0, 0, displayWidth, displayHeight)
                await mainContext.drawImage(
                    img,
                    0, 0,
                    displayWidth,
                    displayHeight
                )
            }

            if (canvasModalRef.current) {
                modalContext = await canvasModalRef.current.getContext("2d", {
                    alpha: false,
                    desynchronized: true
                })

                // Получаем реальные размеры контейнера полноэкранного режима
                var containerWidth = window.innerWidth
                var containerHeight = window.innerHeight

                // Устанавливаем размеры canvas равными размерам окна
                if (canvasModalRef.current.width !== containerWidth || canvasModalRef.current.height !== containerHeight) {
                    canvasModalRef.current.width = containerWidth
                    canvasModalRef.current.height = containerHeight
                }

                // Рассчитываем масштаб с сохранением пропорций
                var scale = Math.min(
                    containerWidth / img.naturalWidth,
                    containerHeight / img.naturalHeight
                )

                var renderWidth = img.naturalWidth * scale
                var renderHeight = img.naturalHeight * scale
                var offsetX = (containerWidth - renderWidth) / 2
                var offsetY = (containerHeight - renderHeight) / 2

                // Настраиваем высокое качество рендеринга
                modalContext.imageSmoothingEnabled = true
                modalContext.imageSmoothingQuality = "high"

                // Очищаем весь canvas
                await modalContext.clearRect(0, 0, containerWidth, containerHeight)

                // Рисуем изображение с правильными размерами
                await modalContext.drawImage(
                    img,
                    0, 0,
                    img.naturalWidth,
                    img.naturalHeight,
                    offsetX,
                    offsetY,
                    renderWidth,
                    renderHeight
                )
            }
        }
        img.onerror = () => {
            console.error("Error loading broadcast image")
        }

        img.src = frameData

        // Предзагрузка для плавного отображения
        img.decode && img.decode().catch(() => {
            console.log("Image decode failed, falling back to onload")
        })
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

        if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
            animationRef.current = requestAnimationFrame(captureAndSendFrames)
            return
        }

        try {
            var context, frameData

            context = await canvas.getContext("2d", {
                alpha: false, // Отключаем альфа-канал для лучшей производительности
                desynchronized: true // Включаем десинхронизацию для оптимизации
            })

            canvas.width = video.videoWidth
            canvas.height = video.videoHeight

            // Настраиваем высококачественное сглаживание
            context.imageSmoothingEnabled = true
            context.imageSmoothingQuality = "high"

            // Очищаем canvas перед отрисовкой
            await context.clearRect(0, 0, canvas.width, canvas.height)

            // Рисуем видео с высоким качеством
            await context.drawImage(
                video,
                0, 0,
                canvas.width,
                canvas.height,
            )

            // Используем WebP если поддерживается для лучшего сжатия
            var format = "image/jpeg"
            if (canvas.toDataURL("image/webp", compressionQuality).length > 0) {
                format = "image/webp"
            }

            frameData = await canvas.toDataURL(format, compressionQuality)

            if (webSocketVideo.current.readyState === WebSocket.OPEN) {
                var data = JSON.stringify({
                    type: "video_frame",
                    frame: frameData,
                    room: params.room_id,
                    user: user,
                    active_users: activeUsers,
                    is_speaking: isSpeaking,
                    current_speaker: currentSpeaker,
                    timestamp: Date.now(),
                })
                await webSocketVideo.current.send(data)
            }
        } catch (err) {
            console.error("Error sending frame:", err)
        }

        var frameInterval = 1000 / currentFPS
        setTimeout(() => {
            animationRef.current = requestAnimationFrame(captureAndSendFrames)
        }, frameInterval)
    }

    // Функция переключения трансляции экрана
    var toggleScreenSharing = async () => {
        if (isScreenSharing) {
            await stopScreenSharing()
        } else {
            var success = await startScreenSharing()
            if (success) {
                setIsScreenSharing(true)
                // Автоматически включаем трансляцию если она была выключена
                if (!isStreaming) {
                    setIsStreaming(true)
                }
            }
        }
    }

    var connectStreamWebSocket = async () => {
        try {
            console.log("Connecting WebSocket...")

            webSocketVideo.current = getWebSocketDjango({
                socket_name: "videoStreamSocket",
                path: `video_stream/${params.room_id}/${user.id}/`,
            })
            webSocketAudio.current = getWebSocketDjango({
                socket_name: "audioStreamSocket",
                path: `audio_stream/${params.room_id}/${user.id}/`,
            })

            webSocketVideo.current.onmessage = async (event) => {
                try {
                    var data

                    // Check if data is Blob (binary data)
                    if (event.data instanceof Blob) {
                        // Convert Blob to text
                        const text = await event.data.text()
                        data = JSON.parse(text)
                    } else {
                        // Data is already text
                        data = JSON.parse(event.data)
                    }

                    var delay = Number(Date.now() - data.timestamp)
                    if (delay < 1000) {
                        await displayProcessedFrame(data.frame)
                        setActiveUsers(prev => {
                            var users = new Set(prev)
                            if (data.user && data.user.username) {
                                users.add(data.user.username)
                            }
                            users.add(user.username)
                            return Array.from(users)
                        })
                    }
                    if (data.type === "error") {
                        setError(`Server error: ${data.message}`)
                    }
                } catch (err) {
                    console.error("Error parsing video message:", err)
                }
            }

            webSocketAudio.current.onmessage = async (event) => {
                try {
                    var data

                    // Check if data is Blob (binary data)
                    if (event.data instanceof Blob) {
                        // Convert Blob to text
                        const text = await event.data.text()
                        data = JSON.parse(text)
                    } else {
                        // Data is already text
                        data = JSON.parse(event.data)
                    }

                    if (data.user.username !== user.username) {
                        var delay = Number(Date.now() - data.timestamp)
                        if (delay < 1000) {
                            await playReceivedAudio(data.audio)
                            setActiveUsers(prev => {
                                var users = new Set(prev)
                                if (data.user && data.user.username) {
                                    users.add(data.user.username)
                                }
                                users.add(user.username)
                                return Array.from(users)
                            })
                            setCurrentSpeaker(data.user)
                        }
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
    }

    // Эффекты
    useEffect(() => {
        checkCameraAccess()
        connectStreamWebSocket()

        return () => {
            disconnectStreamWebSocket()
            stopStreamingVideo()
            stopStreamingAudio()
            stopScreenSharing()
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
            var frameInterval = 1000 / currentFPS
            setTimeout(() => {
                animationRef.current = requestAnimationFrame(captureAndSendFrames)
            }, frameInterval)
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
    }, [isStreaming])

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
                    alignItems: "center",
                    flexDirection: "column"
                }}
            >
                {/* Панель управления в полноэкранном режиме */}
                <div style={{
                    position: "absolute",
                    top: "20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: "10px",
                    zIndex: 10000,
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    padding: "10px",
                    borderRadius: "10px"
                }}>
                    <button
                        onClick={() => setIsStreaming((prev) => !prev)}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: isStreaming ? "#dc3545" : "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontSize: "14px"
                        }}
                    >
                        {isStreaming ? "⏹️ Остановить" : "▶️ Начать трансляцию видео"}
                    </button>

                    <button
                        onClick={toggleScreenSharing}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: isScreenSharing ? "#dc3545" : "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontSize: "14px"
                        }}
                    >
                        {isScreenSharing ? "🖥️ Остановить экран" : "🖥️ Трансляция экрана"}
                    </button>

                    <button
                        onClick={() => setIsAudioStreaming((prev) => !prev)}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: isAudioStreaming ? "#dc3545" : "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontSize: "14px"
                        }}
                    >
                        {isAudioStreaming ? "🔇 Выкл. аудио" : "🔊 Вкл. аудио"}
                    </button>
                </div>

                {/* Кнопка закрытия */}
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

                {/* Canvas для видео */}
                <canvas
                    ref={canvasModalRef}
                    style={{
                        width: "100vw",
                        height: "100vh",
                        display: "block"
                    }}
                />

                {/* Информация о текущем спикере в полноэкранном режиме */}
                {currentSpeaker && (
                    <div style={{
                        position: "absolute",
                        bottom: "20px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        color: "white",
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        padding: "10px 20px",
                        borderRadius: "5px",
                        zIndex: 10000,
                        fontSize: "16px"
                    }}>
                        {currentSpeaker.first_name} {currentSpeaker.last_name}
                    </div>
                )}
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
                    borderRadius: "10px"
                }}>
                    <div style={{ marginBottom: "15px" }}>
                        <button
                            onClick={() => setIsStreaming((prev) => !prev)}
                            style={{
                                margin: "5px",
                                padding: "12px 24px",
                                backgroundColor: isStreaming ? "#dc3545" : "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                cursor: "pointer",
                                fontSize: "16px"
                            }}
                        >
                            {isStreaming ? "⏹️ Остановить" : "▶️ Начать трансляцию видео"}
                        </button>

                        <button
                            onClick={toggleScreenSharing}
                            style={{
                                margin: "5px",
                                padding: "12px 24px",
                                backgroundColor: isScreenSharing ? "#dc3545" : "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                cursor: "pointer",
                                fontSize: "16px"
                            }}
                        >
                            {isScreenSharing ? "🖥️ Остановить экран" : "🖥️ Трансляция экрана"}
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
                            📺 На весь экран
                        </button>
                        <div style={{ marginTop: "10px" }}>
                            <label>FPS (настройка видеообновлений для просмотра пользователями): {currentFPS}</label>
                            <input
                                type="range"
                                min="1"
                                max="60"
                                value={currentFPS}
                                onChange={(e) => setCurrentFPS(Number(e.target.value))}
                                style={{ marginLeft: "10px", width: "150px" }}
                            />
                        </div>
                        <div style={{ marginTop: "10px" }}>
                            <label>Качество транслируемого экрана: </label>
                            <select
                                value={screenQuality}
                                onChange={(e) => setScreenQuality(e.target.value)}
                                style={{
                                    marginLeft: "10px",
                                    padding: "5px",
                                    borderRadius: "5px",
                                    border: "1px solid #ccc"
                                }}
                            >
                                <option value="720p">720p HD</option>
                                <option value="1080p">1080p Full HD</option>
                                <option value="2K">2K Quad HD</option>
                                <option value="4K">4K Ultra HD</option>
                            </select>
                            <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                                Разрешение: {qualitySettings[screenQuality].width}x{qualitySettings[screenQuality].height}
                            </div>
                        </div>
                        <div style={{ marginTop: "10px" }}>
                            <label>Уровень качества картинки: </label>
                            <select
                                value={compressionQuality}
                                onChange={(e) => setCompressionQuality(parseFloat(e.target.value))}
                                style={{
                                    marginLeft: "10px",
                                    padding: "5px",
                                    borderRadius: "5px",
                                    border: "1px solid #ccc"
                                }}
                            >
                                <option value="1.0">100%</option>
                                <option value="0.9">90%</option>
                                <option value="0.8">80%</option>
                                <option value="0.3">30%</option>
                                <option value="0.01">1%</option>
                            </select>
                        </div>
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