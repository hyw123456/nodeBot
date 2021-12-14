const {translateEachOther} = require('./gugu')
const needle = require("needle");
const config = require("./config.js");
function tran(body){
    let message = body.message.replace(/\[CQ:at,qq=\d+\]/g, '')
    const text = translateEachOther(message.trim())
    needle('GET', config.url + '/send_private_msg', {
        user_id: body.user_id,
        // group_id: '297336992',
        message: `${text}`
    }, {})
}

module.exports = function (body) {
    tran(body)
}
