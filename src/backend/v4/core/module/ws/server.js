import https from "https";
import http from "http";
import {log} from "@/backend/v4/decorator/log";
import {WebSocketServer} from "ws";
import * as Util from "@/backend/v4/util/util";
import {EVENT,SERVICE,STATE} from "@/backend/v4/core/service/webrtcContainor";

//% websocket服务
class WsServer{
    constructor() {
        this.webServer=null;                        //, web服务
        this.wsServer=null;                          //, websocket服务
        this.conf=null;                                 //, 配置
        this.listener={};                                //, 监听事件集合
        this.blocks=[];                                 //, 黑名单
        this.events=[];                                 //,websocketServer创建后的事件
    }

    config(conf){
        if(conf)this.conf=conf;
    }

    //. ws服务启动
    startup(){
        this.webServerStartup();
        if (!this.wsServer||this.wsServer._state!==0) {
            this.wsServer = new WebSocketServer({server: this.webServer});
            this.events.map(f=>f());
            this.call(EVENT.WS_SERVER_STARTUP_$);
        }
    }

    //. ws服务停止
    terminate(){
        this.webServerTerminate();
        if(this.wsServer){
            this.wsServer.clients.forEach((ws)=>ws.terminate());
            this.wsServer.close();//close会等待连接关闭
        }
    }

    //. web服务启动
    webServerStartup(){
        if(!this.webServer||(!this.webServer.listening)){
            const {tls,key,cert,port}=this.conf;
            let onReq=this.listener[EVENT.WEB_REQUEST]||this.onRequest;
            this.webServer =tls && key && cert?
                https.createServer({key,cert},onReq):
                http.createServer({},onReq);
            let _this=this;
            this.webServer.listen(port, (...arg)=>_this.onWebServerListen(port,...arg));
            this.call(EVENT.WEB_SERVER_STARTUP_$);
        }
    }

    //. web服务停止
    webServerTerminate(){
        this.webServer&&this.webServer.close();
        this.call(EVENT.WEB_SERVER_TERMINATE_$);
    }

    //. 服务器状态
    state(){
        return{
            port:this.conf?this.conf.port:null,
            ws:this.wsServer?Object.values(STATE.WS_SERVER)[this.wsServer._state]:STATE.WS_SERVER.CLOSED,
            web:this.webServer&&this.webServer.listening?STATE.WEB_SERVER.RUNNING:STATE.WEB_SERVER.CLOSED
        };
    }

    //. 事件
    //, event：事件名，callback：回调，callee：调用方
    on(event,rawCallback,callee){
        let _this=this;
        let callback=(...arg)=>{
            return rawCallback(...arg,_this);
        }
        switch (event){
            case EVENT.WS_SERVER_CONNECTION:   let onWsConnection=Util.combine(this.onWsConnection.bind(this),callback);
                                                                            this.events.push(()=>this.wsServer.on('connection',onWsConnection));
                                                                            break;
            case EVENT.WS_SERVER_TERMINATE:       let onWsTerminate=Util.combine(/*this.terminate,*/callback);
                                                                            this.events.push(()=>this.wsServer.on('close',onWsTerminate));
                                                                            break;
            case EVENT.WS_PONG:                            let onWsPong=Util.combine(this.onWsPong.bind(this,callee),callback);
                                                                            callee.on('pong',onWsPong);
                                                                            break;
            case EVENT.WS_MSG:                              let onWsMessage=Util.combine(this.onWsMessage.bind(this),callback);
                                                                            callee.on('message',onWsMessage); break;
            default:                                                    this.listener[event]=callback;
        }
    }

    //. 发送信息
    //, data:{type} to：目的地   from：发起地，空则为服务器主动发出
    send(data,to,from='server'){
        let content={data,to,from,time:Util.time()};
        this.call(EVENT.WS_MSG_SEND_$, content);
        if(to) return this.unicast(content);
        else return this.broadcast(content);
    }

    //. 广播
    broadcast(content){
        if(!this.wsServer||(!this.wsServer.clients))return;
        this.wsServer.clients.forEach(ws=>ws.send(JSON.stringify({...content,to:ws.clientID})));
    }

    //. 单播
    unicast(data){
        if(!this.wsServer||(!this.wsServer.clients))return;
        this.wsServer.clients.forEach( ws=>{
            ws.clientID === data.to && ws.send(JSON.stringify(data))
        });
    }

    //`================默认事件

    //. websocket message事件
    onWsMessage(ws,callback){}

    //. websocket ping事件
    @log('${ws.clientID}: pong')
    onWsPong(ws){}

    //. websocket 连接事件
    @log((res,ws,...arg)=>{
        switch (res.code){
            case 1003:return '${__res.data.ip} rejected';
            case 1000:return '${__res.data.ip} connected'; }},log.AFTER)
    onWsConnection(ws,im){
        let ip=this.getAddressByIncomeMessage(im);
        if(this.filter(ip)){
            ws.close(1003,'block ip!');
            return {code:1003,data:{ip}};
        }
        return {code:1000,data:{ip}};
    }

    //. webServer启动事件
    @log('WebServer is listening on port ${port}')
    onWebServerListen(port){}

    //. websocketServer停止事件
    @log('WsServer is closing')
    onWsServerClose(){}

    //. web请求事件
    @log('WebServer received request for ${request.url}')
    onRequest(request,response){
        /*if(request.url==='/client'){
            res.write(fs.readFileSync('./index.html'));
            res.end();
            return;
        }*/
        response.writeHead(404);
        response.end();
    }

    //' 调用事件
    call(key,...arg){
        return this.listener[key]&&this.listener[key](...arg);
    }
    //' 过滤ip
    filter(ip){
        if(!this.blocks||this.blocks.length<1)return false;
        return this.blocks.includes(ip);
    }
    //' 获取ip
    getAddressByIncomeMessage(im){
        let remoteAddr=im.headers['x-forwarded-for'] || im.socket.remoteAddress;                             //` im.connection.remoteAddress
        return remoteAddr.substring(0, 7) === "::ffff:"?remoteAddr.substring(7):remoteAddr;             //` ::ffff:127.0.0.1  -  ::ffff: 是ipv6地址
    }
}


//% 辅助类
class WsServerHelper{
    constructor(server) {
        this.clientIDindex=1000;                                                                            //, 客户端起始id
        this.server=server;                                                                                     //, WebsocketServer
        this.timer= {};                                                                                            //, 定时器
        this.util={
            clients: (server,callback) => server.wsServer.clients.forEach(ws => callback(ws)),
            wrap: (outer) => {
                return (inner) => outer(inner);
            }
        };
    }

    //. ping
    @log('${ws.clientID}: ping')
    ping(ws){
        ws.ping();
    }

    //. 生成id
    id(){
        //return crypto.randomUUID();
        return (++this.clientIDindex)+'';
    }

    //. 定时器
    interval(ms,key){
        let _this=this;
        return this.util.wrap(action=>_this.timer[key]=setInterval(action,ms));
    }

    //. 清除定时器
    clearTimer(key){
        clearInterval(this.timer[key]);
    }

}

export {
    WsServer,
    WsServerHelper
}