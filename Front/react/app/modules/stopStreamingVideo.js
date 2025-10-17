export var stopStreamingVideo = ({ streamRef, animationRef, videoRef, setIsStreaming, setCurrentSpeaker }) => {
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