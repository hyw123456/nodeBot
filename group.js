const needle = require('needle')
const config = require('./config.js');
const util = require('./util.js');
const textGet = require('./text.js')
const schedule = require('node-schedule');
schedule.scheduleJob('1 0 8 * * *', () => {
    sendST(undefined, '今日份涩图')
});
const groups = [655389537,  //我的
    297336992, //咕群
    1143106153 // kiyu
]
const enableGroup = [655389537, 297336992] // se
const repeatData = {}

async function getInfoByGroup(group_id, user_id) {
    const res = await needle('GET', config.url + '/get_group_member_info', {group_id, user_id}, {})
    return res.body.data
}

async function repeat(body) {
    if (body.notice_type === 'group_recall') return
    const data = repeatData[body.group_id] || {}
    if (util.isEqual(data.content, body.message)) {
        if (!data.isRepeat) {
            // 复读
            console.log('复读');
            const msg = await util.postMsgToSendMsg(body.message)
            needle('GET', config.url + '/send_group_msg', {
                group_id: body.group_id,
                message: msg
            }, {})
            data.isRepeat = true
        }
    } else {
        repeatData[body.group_id] = {
            content: body.message,
            isRepeat: false,
        }
    }
}

async function recall(body) {
    if ([2382843038, 727295117].includes(body.operator_id)) return
    if (body.notice_type === 'group_recall') {
        const res = await needle('GET', config.url + '/get_msg', {message_id: body.message_id}, {})
        const msg = res.body.data
        if (msg) {
            const sender = await getInfoByGroup(msg.group_id, msg.sender.user_id)
            const sendName = sender.card || sender.nickname;
            let message = ''
            if (body.operator_id === body.user_id) {
                message = sendName + ' 撤回了一条消息：'
            } else {
                const operator = await getInfoByGroup(msg.group_id, body.operator_id)
                message = `${operator.card || operator.nickname} 撤回了一条(${sendName})的消息：`
            }
            let senMsg
            if (/\[CQ:video,file=\w+.video\]/.test(msg.raw_message)) {
                senMsg = msg.raw_message
                await needle('GET', config.url + '/send_group_msg', {
                    group_id: msg.group_id,
                    message: message + '[视频:下方]'
                }, {})
                needle('GET', config.url + '/send_group_msg', {group_id: msg.group_id, message: senMsg}, {})
            } else {
                senMsg = await util.postMsgToSendMsg(msg.message)
                needle('GET', config.url + '/send_group_msg', {
                    group_id: msg.group_id,
                    message: message + senMsg
                }, {})
            }


        }
    }
}

async function maybeSend(body) {
    if (enableGroup.includes(body.group_id) && /来\d*[点份张个][色涩瑟]?图/.test(body.message)) {
        const data = repeatData[body.group_id] || {}
        data.isRepeat = true
        let count = body.message.match(/\d+/)
        count = count ? count[0] : 1
        sendMsgsST(+count, body , /来\d*[点份张个][色涩瑟]图/.test(body.message))
        return
    }
}

function atMe(body) {
    if (body.message && /\[CQ:at,qq=2382843038\]/.test(body.message)) {
        let message = body.message.replace(/\[CQ:at,qq=\d+\]/g, '')
        const text = textGet.getText(message.trim())[0]
        needle('GET', config.url + '/send_group_msg', {
            group_id: body.group_id,
            message: `[CQ:reply,id=${body.message_id}] ${text}`
        }, {})
     return true
    }
}

function sendST(group_id = 297336992, msg = '涩图来啦') {
    util.getSImg().then(img => {
        needle('GET', config.url + '/send_group_msg', {
            group_id: group_id,
            message: `${msg}[CQ:image,file=${img}]`
        }, {})
    })
}

async function sendMsgsST(num = 1, body = {group_id: 297336992}, R18 = true) {
    let img = await util.getSImg(num, R18)
    img = Array.isArray(img) ? img : [img]
    const sender = await getInfoByGroup(body.group_id, body.sender.user_id)
    const params = {
        group_id: body.group_id,
        messages: [{
            "type": "node",
            "data": {
                "name": sender.card || sender.nickname,
                "uin": sender.user_id,
                "content": body.message
            }
        }, ...img.map((i, index) => {
            return {
                "type": "node",
                "data": {
                    "name": "hero" + (index+1),
                    "uin": index + 1000,
                    "content": `[CQ:image,file=${i}]`
                }
            }
        })]
    }
    needle.post(config.url + '/send_group_forward_msg', params, {headers: {'content-type': 'application/json'}})
}
async function cardNew (body){
    if(body.notice_type === 'group_card'){
        const res = await getInfoByGroup(body.group_id, body.user_id)
        needle('GET', config.url + '/send_group_msg', {
            group_id: body.group_id,
            message: `${res.nickname}(${body.user_id})将群名片(${body.card_old})改为：${body.card_new}`
        }, {})
    }
}
module.exports = function (body) {
    if (groups.includes(body.group_id)) { // 只在咕群生效
        maybeSend(body)
        if(atMe(body)) return
        repeat(body) //如果有重复2次的就复读消息
        // saveMsg(body)
        recall(body)
        cardNew(body)
    }
}
