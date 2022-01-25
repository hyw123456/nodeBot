const {translateEachOther} = require('./gugu')
const needle = require("needle");
const config = require("./config.js");
const {getInfo} = require("./7d2d");
function tran(body){
    let message = body.message.replace(/\[CQ:at,qq=\d+\]/g, '')
    const text = translateEachOther(message.trim())
    needle('GET', config.url + '/send_private_msg', {
        user_id: body.user_id,
        // group_id: '297336992',
        message: `${text}`
    }, {})
}

async function days (body){
    console.log(body);
    const tip = '七日杀允许的指令有\n1,gt 获取当前时间\n2,lpi 查看当前在线人员\n3,lp 查看当前在线人员详细信息\n4,say [msg] 输入say 我是傻逼 可在游戏里说话\n例：.7d2d gt '
    if (/七日杀指令/.test(body.message)) {
        needle('GET', config.url + '/send_private_msg', {
            user_id: body.user_id,
            message: tip
        }, {})
        return
    }

    if (/\.7d2d/.test(body.message)) {
        const dr = body.message.match(/(?<=\.7d2d)\s*\w+.*/)
        if (dr) {
            let text = dr[0].trim()
            if(/^say/.test(text)){
                text+= ' by '+(body.sender.card||body.sender.nickname)
            }
            const msg = await getInfo(text)
            needle('GET', config.url + '/send_private_msg', {
                user_id: body.user_id,
                message: msg
            }, {})
        } else {
            needle('GET', config.url + '/send_private_msg', {
                user_id: body.user_id,
                message: tip
            }, {})
        }
    }
}

module.exports = function (body) {
    if(/七日杀指令|\.7d2d/.test(body.message)){
      return   days(body)
    }
    tran(body)
}
