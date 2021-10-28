//express_demo.js 文件
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
//用body parser 来解析post和url信息中的参数
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const group = require('./group.js');
app.post('/', function (req, res) {
    const body = req.body
    if(body.meta_event_type !== 'heartbeat'){
      if(body.group_id){
        group(body)
      }
    }
   res.send('ok');
})

var server = app.listen(8081, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("应用实例，访问地址为 http://%s:%s", host, port)

})