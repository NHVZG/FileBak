import { app} from 'electron'
import {WebSocketServer }   from 'ws';
import  https from "https";
import  http from "http";
import {fbuConfig} from "../config/config-center";
import crypto from "crypto";
import {__log,__result} from "../utils/util";
import Turn from 'node-turn';
let onWsMessageCallBack=()=>{};       //.  ws信息回调
let webServer;                                         //.  web服务器
let wsServer;                                            //.  websocket服务器
let turnServer;                                         //.  tun服务器

//. 停止websocket服务
function wsServerTerminate(){
    webServer&&webServer.close();
    if(wsServer){
        wsServer.clients.forEach((ws)=>ws.terminate());
        wsServer.close();//close会等待连接关闭
    }
}

//. 新建websocket信令服务器
function wsServerBuild({wsMessage}) {
    //创建web服务器
    if (!webServer||(!webServer.listening)) {
        const {tls,key,cert,port}=fbuConfig.web.server.ws;
        webServer =tls && key && cert?
            https.createServer({key,cert},handleRequest):
            http.createServer({},handleRequest);
        webServer.listen(port, () => __log(`Server is listening on port ${port}`));
    }
    //创建websocket服务器
    if (!wsServer||wsServer._state!==0) {
        wsServer = new WebSocketServer({server: webServer});
    }
    if(!wsServer){
        return __result(false)("ERROR: Unable to create WbeSocket server!");
    }

    onWsMessageCallBack=wsMessage||onWsMessageCallBack;

    const interval = setInterval(()=>{
        wsServer.clients.forEach((ws)=> {
            if (ws.isAlive === false)return ws.terminate();//失活标志的连接关闭
            //30秒检查一次，向客户端发送ping帧，收回pong帧标志激活状态，否则等待清除
            ws.isAlive = false;
            ws.ping();
            __log(`${ws.clientID}:ping`);
        });
    }, 30000);

    //wsServer.on('request',handleWsRequest);
    wsServer.on('connection',onWsConnection);
    wsServer.on('close',onWsServerClose.bind(this,interval));
    return __result(true)();
}

//.websocket 处理登录信令服务器
function onWsConnection(ws,im){
    //过滤客户端
    let ip=getAddressByIncomeMessage(im);
    if(filter(im)){
        ws.close(1003,'block ip!');
        return __log(`Connection from ${ip} has been rejected`);
    }
    //接受客户端请求
    ws.isAlive = true;//存活标识
    ws.clientID = crypto.randomUUID();
    ws.send(JSON.stringify({type: 'signed', clientID: ws.clientID}));
    ws.on('message', onWsMessage);
    ws.on('pong', onWsPong);

    __log(`connect from ${ip}-->${ws.clientID}`);
}

//. 处理客戶端发送的心跳帧
function onWsPong(buffer){
    this.isAlive=true;
    __log(`${this.clientID}:pong`);
}


//.处理来自客户端消息
function onWsMessage(data,isBinary){
    let clientID=this.clientID;
    let json = JSON.parse(data.toString());
    switch (json.type) {
        case 'message':                                                             //普通信息
            wsBroadcast(clientID).msg(json.msg);
            onWsMessageCallBack(clientID, json.msg);
            break;
        case 'ice':                                                                      //webRTC交换ice信息，服务端无需解析
            let websocket=getSocketByIp(json.target);           //根据目标ip查找连接
            wsUnicast(websocket.clientID).data('ice',json.data);
            break;
    }
}

//. 处理服务器关闭事件
function onWsServerClose(interval){
    clearInterval(interval);
    __log('WebSocket Server is closing');
}


//.发送消息至客户端
function sendChat(msg,clientID){
    onWsMessageCallBack('server', msg);                                                          //服务端回调
    clientID?
        wsUnicast(clientID).msg(msg)                                                                  //客户端触发
        :wsBroadcast('server').msg(msg);
}

//. 创建turn服务器
function turnServerBuild(){
    turnServer= new Turn({
        // set options
        authMech: 'long-term',
        listeningPort:fbuConfig.web.server.tun.port,
        credentials: {
            [fbuConfig.web.server.tun.username]: fbuConfig.web.server.tun.password
        }
    });
    turnServer.start();
}
function turnServerTerminate(){
    turnServer.stop();
}


//% 广播
function wsBroadcast(sender){
    let cast=(data)=>{
        wsServer&&wsServer.clients&&wsServer.clients.forEach(function(ws) {
            return ws.send(JSON.stringify(data));
        })
    };
    return wsDataBuilder(cast,sender);
}


//% 单播
function wsUnicast(receiver){
    let cast=(data)=> {
        wsServer && wsServer.clients && wsServer.clients.forEach(function (ws) {
            return ws.clientID === receiver && ws.send(JSON.stringify(data));
        });
    };
    return wsDataBuilder(cast,receiver);
}

//% 发送数据构建
function wsDataBuilder(cast,clientID){
    return {
        msg:(msg)=>cast({type:'message',msg,clientID}),
        data:(type,data)=>cast({type,data})
    }
}


//% web服务请求处理
function handleRequest(request,response){
    /*if(req.url==='/client'){
        res.write(fs.readFileSync('./index.html'));
        res.end();
        return;
    }*/
    __log ("Received request for " + res.url);
    response.writeHead(404);
    response.end();
}

//% 过滤客户端
function filter(ip){
    if(!fbuConfig.web.server.ws.block||fbuConfig.web.server.ws.block.length<1)return false;
    return fbuConfig.web.server.ws.block.includes(ip);
}

//% 获取ip
function getAddressByIncomeMessage(im){
    let remoteAddr=im.headers['x-forwarded-for'] || im.socket.remoteAddress;                             //` im.connection.remoteAddress
    return remoteAddr.substring(0, 7) === "::ffff:"?remoteAddr.substring(7):remoteAddr;             //` ::ffff:127.0.0.1  -  ::ffff: 是ipv6地址
}
function getAddressByWs(ws){
    let remoteAddr=ws._socket.remoteAddress;
    return remoteAddr.substring(0, 7) === "::ffff:"?remoteAddr.substring(7):remoteAddr;
}
//% 根据clientID查找对应的websocket连接
function getSocketByClientID(clientID){
    let websocket;
    wsServer&&wsServer.clients&&wsServer.clients.forEach(ws=>{
        if(ws.clientID===clientID)websocket=ws;
    });
    return websocket;
}
//% 根据ip获取对应的websocket连接
function getSocketByIp(ip){
    let websocket;
    wsServer&&wsServer.clients&&wsServer.clients.forEach(ws=>{
        websocket=getAddressByWs(ws)===ip;
    });
    return websocket;
}


export {
    sendChat,
    wsServerBuild,
    wsServerTerminate,
    turnServerBuild,
    turnServerTerminate
};