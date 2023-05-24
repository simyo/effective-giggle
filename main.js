const text = document.querySelector('#text')
const log = txt => {
    console.log(txt)
    text.value += txt + '\n'
    text.scrollTop = text.scrollHeight;
}
const fn = async () => {
    if (!'mediaDevices' in navigator || !'getUserMedia' in navigator.mediaDevices)
        return;

    async function asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    }
    MediaStreamTrack.prototype.getCapabilities = MediaStreamTrack.prototype.getCapabilities || (() => ({
        width: { max: 9999 },
        height: { max: 9999 }
    }))

    const text = document.querySelector('#text')
    const log = txt => {
        console.log(txt)
        text.value += txt + '\n'
        text.scrollTop = text.scrollHeight;
    }
    log(`buildtime: ${window.buildtime}`)
    try {
        await navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => stream.getTracks().forEach(track => track.stop()))
        let devices = await navigator.mediaDevices.enumerateDevices()
        log(`found ${devices.length} devices`)
        console.log({ devices })
        devices.forEach(device => {
            log(`${device.kind}: ${device.label}`)
        })
        devices = devices.filter(d => d.kind === 'videoinput')
        await asyncForEach(devices, async d => {
            log(`starting stream: ${d.deviceId.substring(0, 20)}`)
            await navigator.mediaDevices.getUserMedia({
                video: true,
                deviceId: {
                    exact: d.deviceId
                }
            }).then(stream => {
                const tracks = stream.getTracks()
                log(`started stream (${tracks.length} tracks): ${d.deviceId.substring(0, 20)}`)
                const cap = tracks[0].getCapabilities()
                log(`got caps`)
                console.log(cap)
                log(`Device ${d.deviceId.substring(0, 20)}`)
                const len = 4 + Object.keys(cap).reduce((acc, curr) => Math.max(acc, curr.length), 0)
                Object.entries(cap).forEach(en => {
                    log(('-- ' + en[0]).padEnd(len) + ' : ' + JSON.stringify(en[1]))
                })
                log(`stopping stream: ${d.deviceId.substring(0, 20)}`)
                tracks.forEach(track => track.stop())
                log(`stopped stream: ${d.deviceId.substring(0, 20)}`)
            })
        })

        /* await navigator.mediaDevices.getUserMedia({
             audio: false,
             video: {
                 facingMode: { exact: "environment" }
             }
         }).then(stream => {
             const tracks = stream.getTracks()
             log(`environment stream: (${tracks.length} tracks) ${tracks[0].getSettings().deviceId}, ${tracks[0].label}`)
             tracks.forEach(track => track.stop())
         }, log)*/

        log('probe end')
        navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: { ideal: "environment" }
            }
        }).then(stream => {
            const track = stream.getTracks()[0]
            const {
                width: { max: width },
                height: { max: height }
            } = track.getCapabilities()
            track.stop()
            return { width, height, deviceId: track.getSettings().deviceId }
        }).then(({ width, height, deviceId }) => {
            log('requested:')
            const consts = {
                audio: false,
                video: {
                    width: { ideal: width, max: 1024 },
                    height: { ideal: height, max: 1024 },
                    frameRate: { ideal: 5 },
                    deviceId: { exact: deviceId },
                }
            }
            log(JSON.stringify(consts))
            return navigator.mediaDevices.getUserMedia(consts)
        }).then(stream => {
            const tracks = stream.getTracks()
            const track = tracks[0]
            const { width, height, deviceId } = track.getSettings()
            log('gotten: ' + JSON.stringify({ width, height, deviceId }))
            const video = document.querySelector('.videobox video');
            video.srcObject = stream
            video.onloadedmetadata = function (e) {
                log('video.onloadedmetadata')
            };
            window.stuff = { stream, tracks, track, video }
        })
    } catch (e) {
        log('ERR: ' + e)
    }
    log('getting constraints')
    const consts = navigator.mediaDevices.getSupportedConstraints()
    console.log({ consts })
    const len = 4 + Object.keys(consts).reduce((acc, curr) => Math.max(acc, curr.length), 0)
    log('constraints')
    Object.entries(consts).forEach(en => {
        log(('-- ' + en[0]).padEnd(len) + ' : ' + JSON.stringify(en[1]))
    })
    log('all done')
}
fn()
document.querySelector('button').addEventListener('click', () => {
    const generateImageWithCanvas = (track, videoElem, cutWidth, cutHeight) => {
        const { width: trackWidth, height: trackHeight } = track.getSettings();
        const { clientWidth, clientHeight } = videoElem
        const ratioWidth = cutWidth / clientWidth;
        const targetWidth = ratioWidth * trackWidth;
        const cutoffWidth = trackWidth - targetWidth;
        const sX = cutoffWidth / 2
        const ratioHeight = cutHeight / clientHeight;
        const targetHeight = ratioHeight * trackHeight;
        const cutoffHeight = trackHeight - targetHeight;
        const sY = cutoffHeight / 2
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const context = canvas.getContext("2d")
        context.drawImage(videoElem, sX, sY, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight);
        const image = canvas.toDataURL("image/png");
        console.log({ cutWidth, clientWidth, trackWidth, ratioWidth, targetWidth, cutoffWidth, sX })
        return image;
    };
    const marker = document.querySelector('.overlay .bottom-right')
    const width = (marker.offsetLeft + marker.offsetWidth) * 2
    const height = (marker.offsetTop + marker.offsetHeight) * 2

    document.querySelector('img').src = generateImageWithCanvas(stuff.track, stuff.video, width, height)
})
export { log };