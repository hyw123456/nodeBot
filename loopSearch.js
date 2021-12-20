//轮询
const needle = require("needle");
const config = require("./config.js");
const {getRandomByList} = require("./util");

const url = 'https://live.bilibili.com/'
const groupId = '1143106153'
// 22800732

let time = 90 * 1000, startTime = 30 * 60 * 1000, isStart = false
let isSendNotice = false

function searchLiveBroadcast() {
    needle('GET', url + '22800732', {}, {}).then(res => {
        const result = /html\>\<[^<>]*202\d[^<>]*\>$/.test(res.body)
        if (result) {
            // 开播了
            isStart = true
            if (isSendNotice) {
                isSendNotice = false
                sendMsg()
            }
        }
        const end = /html\>$/.test(res.body)
        if (end) {
            isStart = false
            isSendNotice = true
        }

        setTimeout(searchLiveBroadcast, isStart ? startTime : time)
    }).catch(() => {
        setTimeout(searchLiveBroadcast, isStart ? startTime : time)
    })
}

async function sendMsg() {
    const res = await needle('GET', config.url + '/get_group_member_list', {group_id: groupId}, {})
    const msg = res.body.data.filter(i => i.user_id != '1165775261').map(i => `[CQ:at,qq=${i.user_id}]`).join('')
    needle('GET', config.url + '/send_group_msg', {
        group_id: groupId,
        message: msg + getRandomByList(['开播啦','菠萝','今日份的直播她蕾了'])
    }, {})

    needle('GET', config.url + '/send_group_msg', {
        group_id: groupId,
        message: '[CQ:share,url=https://live.bilibili.com/22800732,title=哔哩哔哩]'
    }, {})
}

module.exports = function () {
    searchLiveBroadcast()
}
