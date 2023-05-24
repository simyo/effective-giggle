// scanner.js

const requiredParam = (param) => {
  const requiredParamError = new Error(`Required parameter, "${param}" is missing.`)
  // preserve original stack trace  
  if (typeof Error.captureStackTrace === 'function') {
    Error.captureStackTrace(requiredParamError, requiredParam)
  }
  throw requiredParamError
}


export const Scanner = function ({
  log = () => null
} = {}) {
  const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
  }

  MediaStreamTrack.prototype.getCapabilities = MediaStreamTrack.prototype.getCapabilities || (() => ({
    width: { max: 9999 },
    height: { max: 9999 }
  }))

  const getDevices = async () => {
    await navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => stream.getTracks().forEach(track => track.stop()))
    return (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput')
  }

  const getEnvironmentDeviceCapabilities = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" }
      }
    })
    const result = stream.getTracks()[0].getCapabilities()
    result.deviceId = stream.getTracks()[0].getSettings().deviceId
    stream.getTracks().forEach(track => track.stop())
    return result
  }

  const stream = async ({
    videoElem = requiredParam('videoElem'),
    deviceId = requiredParam('deviceId'),
    videoConstraints = {},
  } = {}) => {
    videoConstraints = Object.assign({}, videoConstraints, { deviceId })
    const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints })
    videoElem.srcObject = stream
    return stream
  }

  const generateCanvasFromVideo = ({
    track = requiredParam('track'),
    videoElem = requiredParam('videoElem'),
    cutWidth = requiredParam('cutWidth'),
    cutHeight = requiredParam('cutHeight')
  }) => {
    const { width: trackWidth, height: trackHeight } = track.getSettings()
    const { clientWidth, clientHeight } = videoElem
    const ratioWidth = cutWidth / clientWidth
    const targetWidth = ratioWidth * trackWidth
    const cutoffWidth = trackWidth - targetWidth
    const sX = cutoffWidth / 2
    const ratioHeight = cutHeight / clientHeight
    const targetHeight = ratioHeight * trackHeight
    const cutoffHeight = trackHeight - targetHeight
    const sY = cutoffHeight / 2
    const canvas = document.createElement("canvas")
    canvas.width = targetWidth
    canvas.height = targetHeight
    const context = canvas.getContext("2d")
    context.drawImage(videoElem, sX, sY, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight)
    //const image = canvas.toDataURL("image/png")
    log({ cutWidth, clientWidth, trackWidth, ratioWidth, targetWidth, cutoffWidth, sX })
    return canvas
  }

  const clazz = 'Scanner'
  const getClass = () => clazz
  return {
    getClass, getDevices, getEnvironmentDeviceCapabilities, stream, generateCanvasFromVideo
  }
}
