// scanner-test.js
import { Scanner } from './scanner.js'
import 'webrtc-adapter';
const marker = document.querySelector('.overlay .bottom-right')
const img = document.querySelector('img');
const text = document.querySelector('#text')
const video = document.querySelector('video')
const allEvents = el => {
  console.log('adding allEvents', el)
  for (const key in el) {
    if (/^on/.test(key))
      el.addEventListener(key.slice(2), console.log);
  }
}
const btn = document.querySelector('button')
const slider = document.querySelector('input[type=range][name=scan-size]')
const overlay = document.querySelector('.overlay')
const log = txt => {
  console.log(txt)
  text.value += txt + '\n'
  text.scrollTop = text.scrollHeight;
}
log(`buildtime: ${window.buildtime}`)
try {

const scanner = Scanner({

})
log('getting devices')
const devices = await scanner.getDevices()
log('getting caps')
const caps = await scanner.getEnvironmentDeviceCapabilities()
log('getting stream')
const stream = await scanner.stream({
  videoElem: video,
  deviceId: caps.deviceId,
  videoConstraints: {
    width: { max: 1024, ideal: caps.width.max },
    height: { max: 1024, ideal: caps.height.max },
    frameRate: { ideal: 10, },
  }
})
log('devices: ' + devices.length)
const track = stream.getTracks()[0]
const lerp = (min, max, val) => {
  return min * (1 - val) + max * val
}
log('videosize: ' + video.clientWidth  + ', ' + video.clientHeight)
let min = Math.max(video.clientWidth * .1, video.clientHeight * .1, 50)
let max = Math.min(video.clientWidth * .9, video.clientHeight * .9, 500)
const setSize = (x, y) => {
  log('setSize: ' +  x + ', ' + y)
  overlay.style.setProperty('--border-space-h', `${x}px`)
  overlay.style.setProperty('--border-space-v', `${y}px`)
}
video.addEventListener('resize', () => {
  min = Math.max(video.clientWidth * .1, video.clientHeight * .1, 50)
  max = Math.min(video.clientWidth * .9, video.clientHeight * .9, 500)
  setSize(lerp(min, max, getSliderMult(slider)), lerp(min, max, getSliderMult(slider)))
})
const getSliderMult = el => (el.value - el.min) / (el.max - el.min)
setSize(lerp(min, max, getSliderMult(slider)), lerp(min, max, getSliderMult(slider)))
slider.addEventListener('change', e => {
  const newMult = getSliderMult(e.target)
  const lerpVal = lerp(min, max, newMult)
  setSize(lerpVal, lerpVal)
})
log('video done')



const hints = new Map()
const formats = [ZXing.BarcodeFormat.DATA_MATRIX, ZXing.BarcodeFormat.CODE_128]

hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats)
hints.set(ZXing.DecodeHintType.TRY_HARDER, true)

let reader = new ZXingBrowser.BrowserMultiFormatReader(hints)
log('defining scheduler')
const Scheduler = () => {
  let handle = null
  const toggle = () => {
    if (handle != null) {
      clearInterval(handle)
      handle = null
      return
    }
    handle = setInterval(() => {
      const width = (marker.offsetLeft + marker.offsetWidth) * 2
      const height = (marker.offsetTop + marker.offsetHeight) * 2
      const randomMultX = (Math.random() * .1) + .95
      const randomMultY = (Math.random() * .1) + .95
      const cutWidth = Math.min(video.clientWidth, randomMultX * width)
      const cutHeight = Math.min(video.clientHeight, randomMultY * height)
      const canvas = window.canvas = scanner.generateCanvasFromVideo({
        track,
        videoElem: video,
        cutWidth,
        cutHeight,
      })
      //img.src = canvas.toDataURL()
      try {
        const result = log('SCAN ERFOLGREICH: '  + Date.now() + ', ' + JSON.stringify(reader.decodeFromCanvas(canvas)))
      } catch (e) {
        ;
      }
    }, 333)
  }
  return { toggle }
}
log('running scheduler')
const scheduler = Scheduler()
scheduler.toggle()
log('done')
/*btn.addEventListener('click', scheduler.toggle)
video.addEventListener('click', scheduler.toggle)
img.addEventListener('click', scheduler.toggle)*/
}catch(e) {
  log('err: ' + e)
}