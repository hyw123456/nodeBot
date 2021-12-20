//express_demo.js 文件
var express = require('express');
var app = express();
const {getData, saveData} = require('./util')

var bodyParser = require('body-parser');
//用body parser 来解析post和url信息中的参数
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var cors = require('cors')
var corsOptions = {
    origin: '*', //
    optionsSuccessStatus: 200
}

const {translateEachOther}  = require('./gugu')
app.post('/', cors(corsOptions), function (req, res) {
    const body = req.body
    const text = body.text||''
    addCount()
    res.send({
        text: text,
        result: translateEachOther(text)
    });
})

function addCount(count = 1){
    const num = getData('./.number') || 0
    saveData(Number(num)+1, './.number')
}
var server = app.listen(8082, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("应用实例，访问地址为 http://%s:%s", host, port)

})
