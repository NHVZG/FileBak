import crypto from "crypto";
import {WebSocketServer }   from 'ws';
import  https from "https";
import  http from "http";
import Turn from "node-turn";
import {__res,__data} from "../utils/util";
import {AFTER, log} from "../utils/decorator";

function getAddressByIncomeMessage(im){
    let remoteAddr=im.headers['x-forwarded-for'] || im.socket.remoteAddress;                             //` im.connection.remoteAddress
    return remoteAddr.substring(0, 7) === "::ffff:"?remoteAddr.substring(7):remoteAddr;             //` ::ffff:127.0.0.1  -  ::ffff: 是ipv6地址
}

class WsServerBuilder{

    MSG='MSG_EVENT';                                                                 //. 消息发送，接收事件

    WS_SERVER_CREATE='WS_SERVER_CREATE_EVENT';             //. ws服务创建事件

    TURN_SERVER_CREATE='TURN_SERVER_CREATE_EVENT';      //. turn服务创建事件


    constructor() {
        this.webServer=null;
        this.turnServer=null;
        this.wsServer=null;
        this.timer=null;
        this.conf=null;
        this.blocks=[];

        this.funcMap={};
    }

    //` 注册方法
    register(key,callback,cover=false){
        if(!this.funcMap[key]||cover){
            this.funcMap[key]=callback;
        }
    }

    //` 调用方法
    call(key,...arg){
        return this.funcMap[key]?.(...arg);
    }

    //` 过滤ip
    filter(ip){
        if(!this.blocks||this.blocks.length<1)return false;
        return this.blocks.includes(ip);
    }

    //` 数据构建
    data(){
        return __data();
    }

    //` 节点构建then
    node(preStep){
        let builder=new WsServerBuilder();
        builder.webServer=this.webServer;
        builder.turnServer=this.turnServer;
        builder.wsServer=this.wsServer;
        builder.blocks=this.blocks;
        builder.timer=this.timer;
        builder.preNode=this;
        builder.preStep=this.preStep?[...this.preStep]:[];
        if(preStep)builder.preStep.push(preStep);
        return builder;
    }

    //` 简化工具方法
    util(){
        let _this=this;
        return {
            clients:(callback)=>_this.wsServer.clients((ws)=>callback(ws)),
            wsServer:(callback)=>callback(_this.wsServer),
            then:(preStep)=>_this.node(preStep)
        }
    }

    //` 包装
    wrapper(...arg){
        let _this=this;
        return (key)=>{
            if(key){
                _this.util()[key](...arg)
            }
            /*else if(arg){
                arg.map(a=> typeof a==='function'&&a(_this.util()));
            }*/
            return _this;
        }
    }

    id(){
        return crypto.randomUUID();
    }

    //% 默认 - ws.message事件
    onWsMessage(ws,callback){}

    //% 默认 - ws.ping事件
    @log('${ws.clientID}:pong')
    onWsPong(){}

    //% 默认 - webServer启动事件
    @log('Server is listening on port ${port}')
    onWebServerListen(port){}

    //% web请求
    @log('WebServer received request for ${request.url}')
    onRequest(request,response){
        /*if(req.url==='/client'){
            res.write(fs.readFileSync('./index.html'));
            res.end();
            return;
        }*/
        response.writeHead(404);
        response.end();
    }

    //% 默认- wsServer停止事件
    @log('WsServer is closing')
    onWsServerClose(){
        clearInterval(this.timer);
    }

    //% 默认- ws连接事件
    @log((res,ws,...arg)=>{
        switch (res.code){
            case 1003:return `Connect from ${res.data.ip} -->${ws.clientID}`;
            case 1000:return `Connection from ${res.data.ip} has been rejected`;
        }},AFTER)
    onWsConnection(ws,im){
        //过滤客户端
        let ip=getAddressByIncomeMessage(im);
        if(this.filter(ip)){
            ws.close(1003,'block ip!');
            return __res().code(1003).data({ip}).get();
        }
        return __res().code(1000).data({ip}).get();
    }



    //. wsServer构建并启动
    build(conf){
        this.conf=conf;
        if(conf.ws) {
            this.wsServerBuild();
            this.call(this.WS_SERVER_CREATE);
        }
        if(conf.turn){
            this.turnServerBuild();
            this.call(this.TURN_SERVER_CREATE);
        }
    }

    //. webServer启动
    webServerBuild(){
        if(!this.webServer||(!this.webServer.listening)){
            const {tls,key,cert,port}=this.conf.ws;
            this.webServer =tls && key && cert?
                https.createServer({key,cert},this.onRequest):
                http.createServer({},this.onRequest);
            let _this=this;
            this.webServer.listen(port, (...arg)=>{
                _this.onWebServerListen(port,...arg);
            });
        }
    }

    //. wsServer启动
    wsServerBuild(){
        this.webServerBuild();
        if (!this.wsServer||this.wsServer._state!==0) {
            this.wsServer = new WebSocketServer({server: this.webServer});
        }
    }

    //. turn服务启动
    turnServerBuild(){
        let {port,username,password}=this.conf.turn;
        this.turnServer= new Turn({
            // set options
            authMech: 'long-term',
            listeningPort:port,
            credentials: {
                [username]: password
            }
        });
        this.turnServer.start();
    }

    //. turn服务停止
    turnServerTerminate(){
        this.turnServer&&this.turnServer.stop();
    }

    //. wsServer停止
    wsServerTerminate(){
        this.webServerTerminate();
        if(this.wsServer){
            this.wsServer.clients.forEach((ws)=>ws.terminate());
            this.wsServer.close();//close会等待连接关闭
        }
    }

    //. webServer停止
    webServerTerminate(){
        this.webServer&&this.webServer.close();
    }

    //. 定时器
    interval(ms,callback){
        let _this=this;
        return this.wrapper(()=>{
            _this.timer=setInterval(callback,ms);
        });
    }

    //. 事件监听
    on(type,callback,callee){
        let _this=this;
        switch (type){
            case 'connection':     return this.wsServer.on('connection',__flat(this.onWsConnection,callback));
            case 'close':                return this.wsServer.on('close',__flat(this.onWsServerClose,callback));
            case 'ws-pong':          return callee.on('pong',__flat(this.onWsPong,callback));
            case 'ws-message':    return callee.on('message', (data,isBinary)=>{
                _this.onWsMessage(data,isBinary);
                if(callback)callback(JSON.parse(data.toString()));
            });
        }
    }

    //. 发送信息
    sendChat(msg,to,from){
        from?
            this.unicast(this.data().message(msg,from,to)):
            this.broadcast(this.data().message(msg,'server',to));
        this.call(this.MSG,from||'server',msg);
    }

    //. ws发送信息
    send(ws,type){
        switch (type){
            case "signed":ws.send(this.data().signed(ws.clientID));
        }
    }

    //. 发送ping
    @log('${ws.clientID}: ping')
    ping(ws){
        ws.ping();
    }

    //. 广播
    broadcast(data){
        this.wsServer&&this.wsServer.clients&&this.wsServer.clients.forEach((ws)=> {
            data.to=ws.clientID;
            return ws.send(JSON.stringify(data));
        });
    }

    //. 单播
    unicast(data){
        this.wsServer && this.wsServer.clients && this.wsServer.clients.forEach( (ws)=> {
            return ws.clientID === data.to && ws.send(JSON.stringify(data));
        });
    }

}

export {WsServerBuilder}