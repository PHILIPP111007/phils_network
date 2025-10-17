export var stopStreamingAudio = ({ audioProcessorRef, audioContextRef, audioStreamRef, setIsSpeaking, setCurrentSpeaker }) => {
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
