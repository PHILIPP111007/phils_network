export var stopStreamingVideo = async ({ streamRef, animationRef, videoRef, setCurrentSpeaker }) => {
    if (streamRef.current) {
        await streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
    }
    if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null
    }
    await setCurrentSpeaker(() => null)
}