// scanner-test.js
(async () => {
  await import("./scanner.js").then(module => {
    const Scanner = module.Scanner
    window.Scanner = Scanner
  })
})().then(() => {



const img = document.querySelector('img');
const text = document.querySelector('#text')
const wait = async ms => new Promise(resolve => setTimeout(resolve, ms))
const allEvents = el => {
  console.log('adding allEvents', el)
  for (const key in el) {
    if (/^on/.test(key))
      el.addEventListener(key.slice(2), console.log);
  }
}
const btn = document.querySelector('button')
const slider = document.querySelector('input[type=range][name=scan-size]')
const log = txt => {
  console.warn(txt)
  text.value += txt + '\n'
  text.scrollTop = text.scrollHeight;
}
log(`buildtime: ${window.buildtime}`)


  const scanner = window.scanner = Scanner({

  })
  const objs = window.objs = scanner.createVideoBox({ container: document.querySelector('#video-box-container') })
  const { overlay, video, marker, container, box } = objs
  scanner.streamBest({ videoElem: video, container: box })
    .then(stream => {
      window.stream = stream
      const track = stream.getTracks()[0]
      scanner.setScanSize({ boxInfo: objs, x: .5, y: .5 })
      const scheduler = scanner.Scheduler({ boxInfo: objs, stream })
      scheduler.onScan(result => {
        scheduler.toggle()
        track.stop()
        console.log(result)
      })
      scheduler.toggle()
    })
  btn.addEventListener('click', async () => {
    const stream = window.stream = await scanner.streamBest({ videoElem: video, container: box })
    const track = stream.getTracks()[0]
    scanner.setScanSize({ boxInfo: objs, x: .5, y: .5 })
    const scheduler = scanner.Scheduler({ boxInfo: objs, stream })
    scheduler.onScan(result => {
      scheduler.toggle()
      track.stop()
      console.log(result)
    })
    scheduler.toggle()
  })
}).catch(e => console.error)
  /*
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
  
  const lerp = (min, max, val) => {
    return min * (1 - val) + max * val
  }
  let clientHeight = () => video.clientWidth / (video.videoWidth||1) * (video.videoHeight||1)
  log('videosize: ' + video.clientWidth + ', ' + clientHeight())
  const setSize = (x, y) => {
    log('setSize: ' + x + ', ' + y)
    overlay.style.setProperty('--border-space-h', `${x}px`)
    overlay.style.setProperty('--border-space-v', `${y}px`)
  }
  let min = () => Math.max(video.clientWidth * .1, clientHeight() * .1, 50)
  let max = () => Math.min(video.clientWidth * .9, clientHeight() * .9, 500)
 
  video.addEventListener('resize', () => {
    setSize(lerp(min(), max(), getSliderMult(slider)), lerp(min(), max(), getSliderMult(slider)))
  })
  const getSliderMult = el => (el.value - el.min) / (el.max - el.min)
  setSize(lerp(min(), max(), getSliderMult(slider)), lerp(min(), max(), getSliderMult(slider)))
  slider.addEventListener('change', e => {
    const newMult = getSliderMult(e.target)
    const lerpVal = lerp(min(), max(), newMult)
    setSize(lerpVal, lerpVal)
  })
  log('video done')
 
 
 
  
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
        const ts0 = Date.now()
        const width = (marker.offsetLeft + marker.offsetWidth) * 2
        const height = (marker.offsetTop + marker.offsetHeight) * 2
        const randomMultX = (Math.random() * .1) + .95
        const randomMultY = (Math.random() * .1) + .95
        const cutWidth = Math.min(video.clientWidth, randomMultX * width)
        const cutHeight = Math.min(scanner.getVideoSize({ video }).height, randomMultY * height)
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
          const result = log('SCAN ERFOLGREICH: ' + Date.now() + ', ' + JSON.stringify(reader.decodeFromCanvas(canvas)))
        } catch (e) {
          ;
        }
        const ts3 = Date.now()
        // console.log(`full: ${ts3-ts0}ms, calc: ${ts1-ts0}, canvas: ${ts2-ts1}, scan: ${ts3-ts1}`)
      }, 333)
    }
    return { toggle }
  }
  log('running scheduler')
  const scheduler = Scheduler()
  scheduler.toggle()
  log('done')
  //btn.addEventListener('click', scheduler.toggle)
  //video.addEventListener('click', scheduler.toggle)
  //img.addEventListener('click', scheduler.toggle)
  //*/
//} catch (e) {
  //log('err: ' + e)
//}