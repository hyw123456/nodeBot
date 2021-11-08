// 判断消息是否相等   主要是图片
const a = '[CQ:image,file=db9a4953de03d4d9ade5bc2f1acd1d4d.image,url=https://gchat.qpic.cn/gchatpic_new/727295117/655389537-2295391601-DB9A4953DE03D4D9ADE5BC2F1ACD1D4D/0?term=3,subType=1]'
const needle = require('needle')
const config = require("./config.js");
const qq = '72727777'
const sj = '123213232'
const axios = require('axios')

function tranKey(key) {
    if (key === '真') return '丁真'
    if (key === '原批') return '原神'
    if (/^(福瑞|富瑞|富睿)$/.test(key)) return 'furry'
    return key
}

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
    count = Math.min(100, count)
    count = Math.max(count, 1)
    let nums = [], urlsHttp = []

    while (count > 0) {
        let num = Math.min(10, count)
        count = count - num
        nums.push(num)
    }
    await Promise.all(nums.map(i => {
        return needle('GET', 'https://api.nyan.xyz/httpapi/sexphoto/', {r18: isR18, num: i}, {}).then(res => {
            if (res.statusCode === 200) {
                urlsHttp = urlsHttp.concat(res.body.data.url)
            }
        })

    }))
    return urlsHttp.length === 1 ? urlsHttp[0] : urlsHttp
}

const scy = require('./scy')

async function getSCYImg(count=1) {
    const url = await scy.getSCYImg(count)
    return count===1?url[0]:url
}

async function getBaiduImg(key = '', count = 1) {
    if (key === '真')
        key = '丁真'
    let url = 'https://image.baidu.com/search/acjson?tn=resultjson_com&logid=11772383357230813664&ipn=rj&ct=201326592&fp=result&cl=&lm=-1&ie=utf-8&oe=utf-8&word=1&pn=30&rn=30&gsm=1e&queryWord=1'
    url = url.replace(/(queryWord|word)=1/g, '$1=' + encodeURIComponent(key))
    const res = await axios.get(url, {
        headers: {
            "Accept-Language": "zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2",
            "Connection": "keep-alive",
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:60.0) Gecko/20100101 Firefox/60.0",
            "Upgrade-Insecure-Requests": "1",
            'Content-Type': 'text/html; charset=UTF-8'
        }
    })
    const list = res.data.data
    const filter = getRandom(list, count)
    return filter.map(i => i.thumbURL)
}

async function PixivImg(key = '', count = 1) {
    count = Math.min(100, count)
    count = Math.max(count, 1)
    key = tranKey(key)
    const res = await axios.post('https://api.lolicon.app/setu/v2/', {
        proxy: 'https://floral-disk-7293.h123hh.workers.dev',
        num: count,
        tag: key,
        r18: 2
    }, {
        headers: {
            'Content-Type': 'application/json'
        }
    })
    let result = res.data.data.map(i => i.urls.original)
    if (result.length < count) {
        const res1 = await axios.post('https://api.lolicon.app/setu/v2/', {
            proxy: 'https://floral-disk-7293.h123hh.workers.dev',
            num: count - result.length,
            keyword: key,
            r18: 2
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        result = result.concat(res1.data.data.map(i => i.urls.original))
    }
    return [...new Set(result)]
}

function getRandom(list, count) {
    let result = []
    while (count) {
        let i = Math.round(Math.random() * (list.length - 1))
        if (!~result.findIndex(item => item.thumbURL === list[i].thumbURL)) {
            result.push(list[i])
            count--
        }
    }
    return result
}

function getRandomByList(list) {
    return list[Math.round(Math.random() * (list.length - 1))]
}

module.exports = {
    isEqual,
    postMsgToSendMsg,
    getSImg,
    getSCYImg,
    getBaiduImg,
    getRandomByList,
    PixivImg
}
