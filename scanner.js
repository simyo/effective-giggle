// scanner.js
import 'https://unpkg.com/@zxing/browser@0.1.3/umd/zxing-browser.min.js'
import 'https://webrtc.github.io/adapter/adapter-latest.js';

const wait = async ms => new Promise(resolve => setTimeout(resolve, ms))


const requiredParam = (param) => {
  const requiredParamError = new Error(`Required parameter, "${param}" is missing.`)
  // preserve original stack trace  
  if (typeof Error.captureStackTrace === 'function') {
    Error.captureStackTrace(requiredParamError, requiredParam)
  }
  throw requiredParamError
}

const htmlToElement = html => {
  const template = document.createElement('template');
  html = html.trim();
  template.innerHTML = html;
  return template.content.firstChild;
}

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

const lerp = (min, max, val) => {
  return min * (1 - val) + max * val
}

MediaStreamTrack.prototype.getCapabilities = MediaStreamTrack.prototype.getCapabilities || (() => ({
  width: { max: 9999 },
  height: { max: 9999 }
}))


export const Scanner = function ({
  log = () => null
} = {}) {

  let devices = null
  let envDevicesCaps = null

  const getDevices = async ({
    force = false
  } = {}) => {
    if (devices != null && !force)
      return devices
    await navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => stream.getTracks().forEach(track => track.stop()))
    let result = await navigator.mediaDevices.enumerateDevices()
    result = result.filter(d => d.kind === 'videoinput')
    return result
  }

  const getEnvironmentDeviceCapabilities = async ({
    force = false
  } = {}) => {
    if (envDevicesCaps != null && !force)
      return envDevicesCaps
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" }
      }
    })
    const result = stream.getTracks()[0].getCapabilities()
    result.deviceId = stream.getTracks()[0].getSettings().deviceId
    stream.getTracks().forEach(track => track.stop())
    envDevicesCaps = result
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

  const streamBest = async ({
    videoElem = requiredParam('videoElem'),
    container = null
  } = {}) => {
    const devices = await getDevices()
    const envDevicesCaps = await getEnvironmentDeviceCapabilities()
    const aspectRatio = container == null ? null : container.clientWidth / container.clientHeight
    const videoConstraints = {
      deviceId: { ideal: envDevicesCaps.deviceId },
      width: { max: 1024 },
      height: { max: 1024 },
      // aspectRatio: { ideal: aspectRatio },
      frameRate: { ideal: 10, },
    }
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


  /****************
   * dom specific stuff
   ****************/
  const template = `
  <div class="scanner-outer-box" style="width: 100%; height: 100%; display: flex; justify-content: center">
  <div class="scanner-videobox" class="twelve columns"
    style="height: 100%; max-width: 100%; display: inline-block; position: relative; display: flex;">
    <div class="overlay scanner-overlay" style="z-index:10; --border-style: 3px solid red; --border-space-h: 150px; --border-space-v: 150px; position: absolute; top: 50%; left: 50%;">
      <div class="scanner-overlay-element overlay-element top-left" style="position: absolute; width: 50px; height: 50px; border-left: var(--border-style); border-top: var(--border-style); top: calc(-.5 * var(--border-space-v)); left: calc(-.5 * var(--border-space-h));"></div>
      <div class="scanner-overlay-element overlay-element top-right" style="position: absolute; width: 50px; height: 50px; border-right: var(--border-style); border-top: var(--border-style); top: calc(-.5 * var(--border-space-v)); right: calc(-.5 * var(--border-space-h));"></div>
      <div class="scanner-overlay-element overlay-element bottom-left" style="position: absolute; width: 50px; height: 50px; border-left: var(--border-style); border-bottom: var(--border-style); bottom: calc(-.5 * var(--border-space-v)); left: calc(-.5 * var(--border-space-h));"></div>
      <div class="scanner-overlay-element overlay-element bottom-right" style="position: absolute; width: 50px; height: 50px; border-right: var(--border-style); border-bottom: var(--border-style); bottom: calc(-.5 * var(--border-space-v)); right: calc(-.5 * var(--border-space-h));"></div>
    </div>
    <video autoplay muted playsinline style="max-width: 100%; max-height: 100%; display: block;">
  </div>
</div>
`
  const createVideoBox = ({
    container = requiredParam('container')
  } = {}) => {
    const box = htmlToElement(template)
    container.insertAdjacentElement('afterbegin', box)
    const overlay = box.querySelector('.scanner-overlay')
    const video = box.querySelector('video')
    const marker = box.querySelector('.scanner-overlay-element.bottom-right')
    const hints = new Map()
    const formats = [ZXingBrowser.BarcodeFormat.DATA_MATRIX, ZXingBrowser.BarcodeFormat.CODE_128]

    hints.set(2, formats) // ZXing.DecodeHintType.POSSIBLE_FORMATS
    hints.set(3, true) // ZXingBrowser.DecodeHintType.TRY_HARDER

    const reader = new ZXingBrowser.BrowserMultiFormatReader(hints)
    return { container, box, overlay, marker, video, reader }
  }

  const getVideoSize = ({
    video = requiredParam('video')
  } = {}) => {
    const { clientWidth, clientHeight } = video
    if (video.videoWidth === 0)
      return { width: clientWidth, height: clientHeight }
    const videoRatio = video.videoWidth / video.videoHeight
    const clientRatio = clientWidth / clientHeight
    if (videoRatio - clientRatio < 0.01)
      return { width: clientWidth, height: clientHeight }
    if (clientRatio < videoRatio)
      return { width: clientWidth, height: clientWidth / videoRatio }
    if (clientRatio > videoRatio)
      return { width: clientHeight * videoRatio, height: clientHeight }
  }

  const minmax = (size) => ({
    min: {
      x: Math.max(size.width * .1, size.height * .1, 50),
      y: Math.max(size.width * .1, size.height * .1, 50),
    },
    max: {
      x: Math.min(size.width * .9, size.height * .9, 500),
      y: Math.min(size.width * .9, size.height * .9, 500),
    }
  })

  const setScanSize = ({
    boxInfo = requiredParam('boxInfo'),
    x = requiredParam('x'),
    y = requiredParam('y'),
  } = {}) => {
    const { container, box, overlay, marker, video } = boxInfo
    const videoSize = getVideoSize({ video })
    const { min, max } = minmax(videoSize)
    //console.log({ videoSize, min, max })
    overlay.style.setProperty('--border-space-h', `${lerp(min.x, max.x, x)}px`)
    overlay.style.setProperty('--border-space-v', `${lerp(min.y, max.y, y)}px`)
  }

  const Scheduler = ({
    boxInfo = requiredParam('boxInfo'),
    stream = requiredParam('stream')
  }) => {
    const { container, box, overlay, marker, video } = boxInfo
    const videoSize = getVideoSize({ video })
    let callback = null
    const onScan = fn => {
      callback = fn
    }
    const track = stream.getTracks()[0]
    let handle = null
    let running = false
    let ts = Date.now() - 10000
    const toggle = () => {
      if (handle != null) {
        clearInterval(handle)
        handle = null
        return false
      }
      handle = setInterval(() => {
        if (running || Date.now() - ts < 300)
          return
        running = true
        ts = Date.now()
        const ts0 = Date.now()
        const width = (marker.offsetLeft + marker.offsetWidth) * 2
        const height = (marker.offsetTop + marker.offsetHeight) * 2
        const randomMultX = (Math.random() * .1) + .95
        const randomMultY = (Math.random() * .1) + .95
        const cutWidth = Math.min(videoSize.width, randomMultX * width)
        const cutHeight = Math.min(videoSize.height, randomMultY * height)
        const ts1 = Date.now()
        const canvas = window.canvas = scanner.generateCanvasFromVideo({
          track,
          videoElem: video,
          cutWidth,
          cutHeight,
        })
        const ts2 = Date.now()
        //img.src = canvas.toDataURL()
        try {
          const result = boxInfo.reader.decodeFromCanvas(canvas)
          if (typeof (callback) === 'function' && handle != null)
            callback(result)
          log('SCAN ERFOLGREICH: ' + Date.now() + ', ' + JSON.stringify())
        } catch (e) {
          ; //NOOP
        }
        const ts3 = Date.now()
        // console.log(`full: ${ts3-ts0}ms, calc: ${ts1-ts0}, canvas: ${ts2-ts1}, scan: ${ts3-ts1}`)
        running = false
      }, 50)
      return true
    }
    return { toggle, onScan }
  }

  const clazz = 'Scanner'
  const getClass = () => clazz
  return {
    getClass, getDevices, getEnvironmentDeviceCapabilities, stream, generateCanvasFromVideo,
    createVideoBox, streamBest, setScanSize, getVideoSize, Scheduler
  }
}
