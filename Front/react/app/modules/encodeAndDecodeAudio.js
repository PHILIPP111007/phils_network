export var encodeAudio = async (audioBuffer) => {
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

export var decodeAudio = async (base64Data) => {
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