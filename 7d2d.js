var net = require('net');

var socket
function connect(){
    socket = net.connect({
        host: '120.27.151.130',
        port: 8081
    }, function () {
        socket.write("CHANGEME\r\n")
    })
}
connect()
var obj = {
    _content: [],
    set content(text) {
        obj._content.push(text)
        if (obj._content && obj._content.length > 50) {
            obj._content = obj._content.slice(-10)
        }
    },
    get content() {
        return obj._content
    }
}
socket.on("data", function (data) {
    obj.content = data.toString()
})

socket.on("end", function (err) {
    console.log("end");
    setTimeout(() => {
        connect()
    })
})

function getInfo(type) {
    if(!/^(lp|lpi|gt|say)\s?/.test(type)){
        return '不允许的指令'
    }
    obj._content = []
    socket.write(type+"\r\n")
    if(/^say\s?/.test(type)){
        return 'server:'+type.replace(/say/, '')
    }
    return getMsg(type).then(res => {
        let result = res
        result = result.replace(/n?e?t from [\d.:]*\r\n/, '')
        result = result.replace(/202.*\r\n/, '')
        return result
    })
}

function getMsg(type) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log(obj.content);
            const list = [...obj.content].reverse()
            const index  =  list.findIndex(i => {
                return ~i.indexOf(`command '${type}' by Tel`)
            })
            if(~index){
                console.log(list.length - (index - 1) - 1);
                resolve(obj.content[list.length-(index-1)-1])
            }else{
                reject()
            }
        }, 500)
    })
}



module.exports = {
    getInfo
}
