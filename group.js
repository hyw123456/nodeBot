const needle = require('needle')
const config = require('./config.js');
const util = require('./util.js');
const textGet = require('./text.js')
const schedule = require('node-schedule');
const {getRandomByList} = require("./util");
const {getSCYImgAndCode} = require('./scy')
const {translateEachOther} = require('./gugu')
const {getInfo} = require('./7d2d')
let isSS = true
let userInfo = {
    nickname: '',
    user_id: ''
}
async function getUserInfo(){
    const data = await needle('GET', config.url + '/get_login_info', {}, {})
    userInfo = data.body.data
}
getUserInfo()

schedule.scheduleJob('2 0 8 * * *', () => {
    sendST(undefined, '今天你波奇了吗')
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
        data.count--
        if (!data.count) {
            // 复读
            console.log('复读');
            let msg
            msg = await util.postMsgToSendMsg(body.message)
            needle('GET', config.url + '/send_group_msg', {
                group_id: body.group_id,
                message: msg
            }, {})
        }
    } else {
        repeatData[body.group_id] = {
            content: body.message,
            count: Math.round(Math.random() + 2)
        }
    }
}

async function recall(body) {
    if ([userInfo.user_id, 727295117].includes(body.operator_id)) return
    if (!enableGroup.includes(body.group_id)) return
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
            if (/\[CQ:(video|share|music)[^\]]*\]/.test(msg.raw_message)) {
                senMsg = msg.raw_message
                await needle('GET', config.url + '/send_group_msg', {
                    group_id: msg.group_id,
                    message: message + '[下方]'
                }, {})
                needle('GET', config.url + '/send_group_msg', {group_id: msg.group_id, message: senMsg}, {})
            } else {
                senMsg = await util.postMsgToSendMsg(msg.message)
                if (isSS && Math.random() > 0.5) {
                    isSS = true
                    setTimeout(() => {
                        isSS = true
                    }, 2 * 60 * 1000);
                    needle('GET', config.url + '/send_group_msg', {
                        group_id: 655389537,
                        message: message + senMsg
                    }, {})
                    senMsg = util.getRandomByList(['周末穿女装给你们爽爽', '等我雌堕给你们爽', '鶸酱c我', '不想当♂的了',
                        '晚上好无聊，老地址来个南桐', 'cpdd,我是0', '感觉不如原神...牛子', '戳我XP了', '别来找我了，我不是南桐，那天只是喝多了',
                        '我就是RPQ，怎么了', '昨天嫖了个伪娘，感觉真TM爽', '我是傻逼', '你绿我也没关系，我喜欢你'])
                }
                needle('GET', config.url + '/send_group_msg', {
                    group_id: msg.group_id,
                    message: message + senMsg
                }, {})
            }


        }
    }
}

function maybeSend(body) {
    if (enableGroup.includes(body.group_id) && /来\d*[点份张个][^图]+图/.test(body.message)) {
        let params = body.message.match(/(\d*)[点份张个]([^图]+)图/)
        let count = params[1] || 1
        let type = params[2]
        switch (type) {
            case  '':
                sendMsgsST(+count, body, false)
                break;
            case  '涩':
            case  '色':
            case  '瑟':
                sendMsgsST(+count, body, true)
                break;
            case '3':
                sendSCYImg(body, +count)
                break;
            default:
                replyAtOther(+count, body, type)
                break

        }
        return true
    }
}
// const auth = '635045571'
// const auth = '655389537'


async function seven(body) {
    const tip = `七日杀允许的指令有
1, gt 获取当前时间
2, lpi 查看当前在线人员
3, lp 查看当前在线人员详细信息
4, say [msg] 输入say 我是傻逼 可在游戏里说话
5, sw 刷一大波僵尸
${body.group_id == config.authGroup? '6, st 调整游戏时间，如st 6 11 12调整到第6天早上11点12分\n7, tp 传送，如 tp 171 856.将id为171玩家传到id: 856边上，id用lpi指令获取\n':''}例：.7d2d gt `
    if (/七日杀指令/.test(body.message)) {
        needle('GET', config.url + '/send_group_msg', {
            group_id: body.group_id,
            message: tip
        }, {})
        return
    }

    if (/\.7d2d/.test(body.message)) {
        const dr = body.message.match(/(?<=\.7d2d)\s*\w+.*/)
        if (dr) {
            let text = dr[0].trim()
            if(/^say/.test(text)){
                text+= '。by:'+(body.sender.card||body.sender.nickname)
                text = text.replace(/\s+/g, ',')
            }
            if(/^tp/){
                text = text.replace(/^tp/, 'teleportplayer')
            }
            let msg = ''
            let reg = body.group_id == config.authGroup? /^(lp|lpi|gt|say|sw|teleportplayer|st)\s?/:/^(lp|lpi|gt|say|sw)\s?/
            if(!reg.test(text)){
                msg = '不允许的指令'
            }else{
                 msg = await getInfo(text)
            }
            needle('GET', config.url + '/send_group_msg', {
                group_id: body.group_id,
                message: msg
            }, {})
        } else {
            needle('GET', config.url + '/send_group_msg', {
                group_id: body.group_id,
                message: tip
            }, {})
        }
    }
}


function query(body) {
    if (enableGroup.includes(body.group_id) && /#[^#]+/.test(body.message)) {
        let keys = body.message.match(/(?<=#)[^#]+/)[0]

        keys = keys.replace(/查询?/, '')


        return true
    }
}

async function replyAtOther(count, body, type) {
    const imgs = await util.PixivImg(type, count)
    if (!imgs.length) {
        return needle('GET', config.url + '/send_group_msg', {
            group_id: body.group_id,
            message: `[CQ:reply,id=${body.message_id}] 没找到${type}，换个XP试试`
        }, {})
    }
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
        }, ...imgs.map((i, index) => {
            return {
                "type": "node",
                "data": {
                    "name": "hero" + (index + 1),
                    "uin": index + 1000,
                    "content": `[CQ:image,file=${i}]`
                }
            }
        })]
    }
    needle.post(config.url + '/send_group_forward_msg', params, {headers: {'content-type': 'application/json'}})
}

async function sendSCYImg(body, count = 1) {
    let urls = await util.getSCYImg(count)
    urls = Array.isArray(urls) ? urls : [urls]
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
        }, ...urls.map((i, index) => {
            return {
                "type": "node",
                "data": {
                    "name": "hero" + (index + 1),
                    "uin": index + 1000,
                    "content": `[CQ:image,file=${i}]`
                }
            }
        })]
    }
    needle.post(config.url + '/send_group_forward_msg', params, {headers: {'content-type': 'application/json'}})
}

function atMe(body) {
    if (body.message && ~body.message.indexOf(`[CQ:at,qq=${userInfo.user_id}]`)) {
        let message = body.message.replace(/\[CQ:at,qq=\d+\]/g, '')
        const text = translateEachOther(message.trim())
        needle('GET', config.url + '/send_group_msg', {
            group_id: body.group_id,
            message: `[CQ:reply,id=${body.message_id}] ${text}`
        }, {})

        return true
    }
}

function isAtAll(body) {
    if (/@全体成员/.test(body.message)) {
        atAll(body)
        return true
    }
}

async function atAll(body) {
    const res = await needle('GET', config.url + '/get_group_member_list', {group_id: body.group_id}, {})
    const msg = res.body.data.filter(i => i.user_id != '727295117').map(i => `[CQ:at,qq=${i.user_id}]`).join('')
    needle('GET', config.url + '/send_group_msg', {
        group_id: body.group_id,
        message: msg
    }, {})
}

async function sendST(group_id = 297336992, msg) {
    const [url, {url: url2, code}] = await Promise.all([util.getSImg(), getSCYImgAndCode()])
    const params = {
        group_id: group_id,
        messages: [{
            "type": "node",
            "data": {
                "name": 'hero',
                "uin": 10085,
                "content": msg
            }
        }, {
            "type": "node",
            "data": {
                "name": '2',
                "uin": 10086,
                "content": `[CQ:image,file=${url}]`
            }
        },
            {
                "type": "node",
                "data": {
                    "name": '3',
                    "uin": 10087,
                    "content": `[CQ:image,file=${url2}]`
                }
            },
            {
                "type": "node",
                "data": {
                    "name": '车牌',
                    "uin": 10088,
                    "content": translateEachOther(code)
                }
            }]
    }
    needle.post(config.url + '/send_group_forward_msg', params, {headers: {'content-type': 'application/json'}})
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
                    "name": "hero" + (index + 1),
                    "uin": index + 1000,
                    "content": `[CQ:image,file=${i}]`
                }
            }
        })]
    }
    needle.post(config.url + '/send_group_forward_msg', params, {headers: {'content-type': 'application/json'}})
}

async function cardNew(body) {
    if (body.notice_type === 'group_card') {
        const res = await getInfoByGroup(body.group_id, body.user_id)
        needle('GET', config.url + '/send_group_msg', {
            group_id: body.group_id,
            message: `${res.nickname}(${body.user_id})将群名片(${body.card_old})改为：${body.card_new}`
        }, {})
    }
}

module.exports = function (body) {
    seven(body)
    if (groups.includes(body.group_id)) { // 只在咕群生效
        if (isAtAll(body)) return;
        if (maybeSend(body)) return;
        if (atMe(body)) return
        if (query(body)) return;
        repeat(body) //如果有重复2次的就复读消息
        // saveMsg(body)
        // recall(body)
        cardNew(body)
    }
}
