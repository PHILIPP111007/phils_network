export var playReceivedAudio = async ({ audioData, decodeAudio }) => {
    var audioContext = new (window.AudioContext || window.webkitAudioContext)()
    var decodedData = await decodeAudio(audioData)

    var buffer = audioContext.createBuffer(1, decodedData.length, audioContext.sampleRate)
    buffer.copyToChannel(decodedData, 0)

    var source = audioContext.createBufferSource()
    source.buffer = buffer
    source.connect(audioContext.destination)
    source.start()
}