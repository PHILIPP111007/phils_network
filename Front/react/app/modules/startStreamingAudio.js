export var startStreamingAudio = async ({ setError, audioStreamRef, startAudioProcessing }) => {
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

        await startAudioProcessing(stream)
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