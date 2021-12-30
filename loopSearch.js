//轮询
const needle = require("needle");
const config = require("./config.js");
const {getRandomByList} = require("./util");
const moment =require('moment')

const url = 'https://live.bilibili.com/'
// 22800732
// 1475443 气浪
let time = 100 * 1000, startTime = 60 * 60 * 1000

function startTask(id = '22800732', groupId = '1143106153') {
    let isStart = false, isSendNotice = false
    const searchLiveBroadcast = function () {
        const hour = new Date().getHours()
        if (hour < 9) {
            isStart = false
            isSendNotice = false
            setTimeout(searchLiveBroadcast, 60 * 60 * 1000)
            return
        }
        if (hour < 17) {
            time = 3 * 60 * 1000
        } else {
            time = 100 * 1000
        }
        needle('GET', url + id, {}, {}).then(res => {
            const time = res.body.match(/html\>\<[^<>]*(20\d{2}[^-]*-\s*.........)[^<>]*\>$/)
            if (time&&time[1]&&moment().diff(moment(time[1].trim(), 'YYYY.MM.DD - HH:mm:ss'), 'minute') < 10) {
                // 开播了
                isStart = true
                if (isSendNotice) {
                    isSendNotice = false
                    const imgs = res.body.match(/"keyframe":\s*"(http:[^"]*\.jpg)"/)
                    const image = imgs&&imgs[1]&&imgs[1].replace(/\\u002F/g,'/')
                    sendMsg(id, groupId, image)
                }
            }
            const end = /html\>$/.test(res.body)
            if (end || (time&&time[1]&&moment().diff(moment(time[1].trim(), 'YYYY.MM.DD - HH:mm:ss'), 'minute') > 60)) {
                isStart = false
                isSendNotice = true
            }
            setTimeout(searchLiveBroadcast, isStart ? startTime : time)
        }).catch(() => {
            setTimeout(searchLiveBroadcast, isStart ? startTime : time)
        })
    }
    searchLiveBroadcast()
}


async function sendMsg(id, groupId , image = '') {
    const res = await needle('GET', config.url + '/get_group_member_list', {group_id: groupId}, {})
    let msg = res.body.data.filter(i => i.user_id != '1165775261').map(i => `[CQ:at,qq=${i.user_id}]`).join('')
    if (groupId === '297336992') {
        msg = ''
    }
    needle('GET', config.url + '/send_group_msg', {
        group_id: groupId,
        message: `[CQ:share,url=https://live.bilibili.com/${id},title=${groupId === '297336992' ? '狼队的直播' : '耳仔的直播'},image=${image}]`
    }, {})

    needle('GET', config.url + '/send_group_msg', {
        group_id: groupId,
        message: msg + getRandomByList(['开播啦', '菠萝', '今日份的直播她蕾了'])
    }, {})
}

module.exports = function () {
    // startTask()
    setTimeout(() => {
        startTask('1475443', '297336992') //咕群
    }, 50000)
}
