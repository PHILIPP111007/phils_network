export var stopStreamingAudio = async ({ audioProcessorRef, audioContextRef, audioStreamRef, setIsSpeaking }) => {
    if (audioProcessorRef.current) {
        await audioProcessorRef.current.disconnect()
        audioProcessorRef.current.onaudioprocess = null
        audioProcessorRef.current = null
    }
    if (audioContextRef.current) {
        await audioContextRef.current.close()
        audioContextRef.current = null
    }
    if (audioStreamRef.current) {
        await audioStreamRef.current.getTracks().forEach(track => track.stop())
        audioStreamRef.current = null
    }
    await setIsSpeaking(false)
}
