// 判断消息是否相等   主要是图片
const a = '[CQ:image,file=db9a4953de03d4d9ade5bc2f1acd1d4d.image,url=https://gchat.qpic.cn/gchatpic_new/727295117/655389537-2295391601-DB9A4953DE03D4D9ADE5BC2F1ACD1D4D/0?term=3,subType=1]'
const needle = require('needle')
const config = require("./config.js");
const qq = '72727777'
const sj = '123213232'

function isEqual(msg = '', newMsg = '') {
    // return newMsg === msg
    if (msg === newMsg) return true
    if (msg.length > 150 && newMsg.length > 150) {
        msg = msg.replace(/\[CQ:image,file=(\w+\.image)[^\]]*\]/, '[CQ:image,file=$1]')
        newMsg = newMsg.replace(/\[CQ:image,file=(\w+\.image)[^\]]*\]/, '[CQ:image,file=$1]')
        return newMsg === msg
    }
    return false
}

async function postMsgToSendMsg(message = '') {
    // message = message.replace(/\[CQ:image,file=(\w+\.image),url=(https?[^\]]*)(?=,)[^\]]*\]/gi, '[CQ:image,file=file:///root/dist/img/asd5.jpeg]')
    // message = message.replace(/\[CQ:image,file=(\w+\.image),url=(https?[^\]]*)(?=,)[^\]]*\]/gi, '[CQ:image,file=file:///root/qqrobot/data/images/$1]')
    // message = message.replace(/\[CQ:image,file=(\w+\.image),url=(https?[^\]]*)(?=,)[^\]]*\]/gi, '[图片]')
    let msg = message.split(/(?<=\])/)
    const all = []
    for (let i = 0; i < msg.length; i++) {
        const file = msg[i].match(/(?<=file=)(\w+\.image)/)
        if (file && file[0]) {
            all.push(needle('GET', config.url + '/get_image', {file: file[0]}, {}).then(res => {
                msg[i] = msg[i].replace(/\[CQ:image,file=(\w+\.image),url=(https?[^\]]*)(?=,)[^\]]*\]/i, '[CQ:image,file=file:///root/qqrobot/' + res.body.data.file + ']')
            }))
        }
    }
    await Promise.all(all)
    return msg.join('')
}

async function getSImg(count = 1, isR18 = true) {
    count = Math.min(10, count)
    count = Math.max(count, 1)
    const res = await needle('GET', 'https://api.nyan.xyz/httpapi/sexphoto/', {r18: isR18, num: count}, {})
    if (res.statusCode === 200) {
        return res.body.data.url.length > 1 ? res.body.data.url : res.body.data.url[0]
    }
    return ''
}

module.exports = {
    isEqual,
    postMsgToSendMsg,
    getSImg
}
