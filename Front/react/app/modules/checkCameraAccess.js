export var checkCameraAccess = async ({ setError }) => {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("Ваш браузер не поддерживает доступ к камере.")
            return
        }

        var permissions = await navigator.permissions.query({ name: "camera" })

        if (permissions.state === "denied") {
            setError("Доступ к камере запрещен.")
        }

    } catch (err) {
        console.warn("Permission API not supported:", err)
    }
}