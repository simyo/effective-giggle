const fn = async () => {
    if (!'mediaDevices' in navigator || !'getUserMedia' in navigator.mediaDevices)
        return;

    async function asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    }

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

        await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: { exact: "environment" }
            }
        }).then(stream => {
            const tracks = stream.getTracks()
            log(`environment stream: (${tracks.length} tracks) ${tracks[0].getSettings().deviceId}, ${tracks[0].label}`)
            tracks.forEach(track => track.stop())
        }, log)

        log('probe end')
        navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true
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
                video: true,
                width: { exact: width },
                height: { exact: height },
                deviceId: { exact: deviceId },
            }
            log(JSON.stringify(consts))
            return navigator.mediaDevices.getUserMedia(consts)
        }).then(stream => {
            const tracks = stream.getTracks()
            const track = tracks[0]
            const { width, height, deviceId } = track.getSettings()
            log('gotten: ' + JSON.stringify({ width, height, deviceId }))
            const video = document.querySelector('video#feed');
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