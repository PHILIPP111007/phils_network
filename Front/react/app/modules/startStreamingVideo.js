export var startStreamingVideo = async ({ setError, videoRef, streamRef }) => {
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