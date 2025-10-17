export var displayProcessedFrame = async ({ frameData, isFullscreen, canvasModalRef, canvasRef }) => {
    var img = new Image()
    img.onload = async () => {
        var targetCanvas = isFullscreen ? canvasModalRef.current : canvasRef.current
        if (!targetCanvas) {
            console.warn("Canvas not available")
            return
        }
        var context = targetCanvas.getContext('2d')
        if (!context) {
            console.warn("Canvas context not available")
            return
        }

        // Устанавливаем размеры canvas
        targetCanvas.width = img.width
        targetCanvas.height = img.height

        // Очищаем и рисуем
        context.clearRect(0, 0, targetCanvas.width, targetCanvas.height)
        context.drawImage(img, 0, 0, targetCanvas.width, targetCanvas.height)
    }
    img.onerror = () => {
        console.error("Error loading broadcast image")
    }
    img.src = frameData
}
