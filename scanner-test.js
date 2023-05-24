// scanner-test.js
import { Scanner } from './scanner.js'
import 'webrtc-adapter';

const allEvents = el => {
  console.log('adding allEvents', el)
  for (const key in el) {
    if (/^on/.test(key))
      el.addEventListener(key.slice(2), console.log);
  }
}
const marker = document.querySelector('.overlay .bottom-right')
const img = document.querySelector('img');
const text = document.querySelector('#text')
const video = document.querySelector('video')
const btn = document.querySelector('button')

const log = txt => {
  console.log(txt)
  text.value += txt + '\n'
  text.scrollTop = text.scrollHeight;
}

const scanner = Scanner({

})
await scanner.getDevices()
const caps = await scanner.getEnvironmentDeviceCapabilities()
const stream = await scanner.stream({
  videoElem: video,
  deviceId: caps.deviceId,
  videoConstraints: {
    width: { max: 1024, ideal: caps.width.max },
    height: { max: 1024, ideal: caps.height.max },
    frameRate: { ideal: 10, },
  }
})

const x = Math.min(video.clientWidth * .8, video.clientHeight * .8, 200)
document.querySelector('.overlay').style.setProperty('--border-space-h', `${x}px`)
document.querySelector('.overlay').style.setProperty('--border-space-v', `${x}px`)

const hints = new Map()
const formats = [ZXing.BarcodeFormat.DATA_MATRIX, ZXing.BarcodeFormat.CODE_128]

hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats)
hints.set(ZXing.DecodeHintType.TRY_HARDER, true)

let reader = new ZXingBrowser.BrowserMultiFormatReader(hints)
//const img2 = document.createElement("img")
img.addEventListener('load', () => {
  //img2.src = img.src
})
/*img2.addEventListener('load', () => {
  const result = zReader.decodeFromImageUrl(img.src)
    .then(result => {
      debugger
      log(result)
    }, err => null)
})*/

const track = stream.getTracks()[0]
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
      /*log({
        msg: 'interval',
        width,
        height,
        randomMultX,
        randomMultY,
      cutWidth,
      cutHeight,
    })*/
      const canvas = window.canvas = scanner.generateCanvasFromVideo({
        track,
        videoElem: video,
        cutWidth,
        cutHeight,
      })
      //img.src = canvas.toDataURL()
      try {
        const result = log(JSON.stringify(reader.decodeFromCanvas(canvas)))
      } catch(e) {
        ;
      }
    }, 200)
  }
  return { toggle }
}

const scheduler = Scheduler()
scheduler.toggle()
btn.addEventListener('click', scheduler.toggle)
video.addEventListener('click', scheduler.toggle)
img.addEventListener('click', scheduler.toggle)