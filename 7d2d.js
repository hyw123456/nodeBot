var net = require('net');
let cd = 0

var socket,isConnect = false;
function connect(){
    return new Promise((resolve) => {
        socket = net.connect({
            host: '120.27.151.130',
            port: 8081
        }, function () {
            socket.write("CHANGEME\r\n")
            isConnect = true
            resolve()


            socket.on("data", function (data) {
                obj.content = data.toString()
            })
            
            socket.on("end", function (err) {
                console.log("end");
                isConnect = false
            })


        })
    })
   
}

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


async function getInfo(type) {
    if(type === 'sw'){
        type = 'spawnwanderinghorde'
        if(cd){
            return '指令CD中'
        }
    }
    if(!isConnect){
        await connect()
    }
    obj._content = []
    socket.write(type+"\r\n")
    if(/^say\s?/.test(type)){
        return 'server:'+type.replace(/say/, '')
    }
    if(type === 'spawnwanderinghorde'){
        cd = 60
        const inner = setInterval(() => {
            cd--;
            if(cd <=0){
                clearInterval(inner)
            }
        }, 1000)
        return '大波僵尸正在路上,在线玩家表示很赞'
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
        }, 300)
    })
}



module.exports = {
    getInfo
}
