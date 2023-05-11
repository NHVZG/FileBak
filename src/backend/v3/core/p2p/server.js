import crypto from "crypto";
import {AFTER, log} from "../../utils/decorator/log";
import https from "https";
import http from "http";
import {WebSocketServer} from "ws";
import Turn from "node-turn";
import {__time} from "../../utils/util";


function getAddressByIncomeMessage(im){
    let remoteAddr=im.headers['x-forwarded-for'] || im.socket.remoteAddress;                             //` im.connection.remoteAddress
    return remoteAddr.substring(0, 7) === "::ffff:"?remoteAddr.substring(7):remoteAddr;             //` ::ffff:127.0.0.1  -  ::ffff: 是ipv6地址
}

class WsServerBuilder{
    ON_WS_MESSAGE_SEND='onWsMessageSend';       //. 消息发送事件
    ON_WS_SERVER_CREATE='onWsServerCreate';          //. 服务器创建事件

    TYPE_WS='ws';
    TYPE_TURN='turn';
    TYPE_WEB='web';

    constructor() {
        this.clientIDindex=1000;
        this.webServer=null;
        this.turnServer=null;
        this.wsServer=null;
        this.timer=null;
        this.conf= {};
        this.blocks=[];

        this.funcMap={};
    }

    //` 过滤ip
    filter(ip){
        if(!this.blocks||this.blocks.length<1)return false;
        return this.blocks.includes(ip);
    }

    //` 调用方法
    call(key,...arg){
        return this.funcMap[key]&&this.funcMap[key](...arg);
    }

    //` 注册回调方法
    register(key,callback,cover=false){
        if(!this.funcMap[key]||cover){
            this.funcMap[key]=callback;
        }
    }

    //` 简化工具方法
    util(){
        let _this=this;
        let func= {
            clients:(callback)=> _this.wsServer.clients.forEach((ws)=>callback(ws)),
            wsServer:(callback)=>callback(_this.wsServer),
            wrap:(outer,receiveFunc)=>{
                return (key)=>{
                    return receiveFunc?
                        (...arg)=>outer.bind(_this)(()=>func[key].bind(_this)(...arg)):
                        (...arg)=>outer.bind(_this)(func[key].bind(_this)(...arg));
                };
            },
            flat:(...func)=>{
                return (...arg)=>{
                    return func.filter(f=>f).map((f)=>f.bind(_this)(...arg));
                }
            }
        }
        return (key)=>func[key]||((...arg)=>arg);
    }


    @log('Server is listening on port ${port}')                                                       //% 默认 - webServer启动事件
    onWebServerListen(port){}

    @log('WebServer received request for ${request.url}')                                   //% web请求
    onRequest(request,response){
        /*if(req.url==='/client'){
            res.write(fs.readFileSync('./index.html'));
            res.end();
            return;
        }*/
        response.writeHead(404);
        response.end();
    }

    onWsMessage(ws,callback){}                                                                            //% 默认 - ws.message事件

    @log('${ws.clientID}:pong')                                                                              //% 默认 - ws.ping事件
    onWsPong(ws){}

    @log('WsServer is closing')                                                                              //% 默认- wsServer停止事件
    onWsServerClose(){
        clearInterval(this.timer);
    }

    @log((res,ws,...arg)=>{                                                                                      //% 默认- ws连接事件
        switch (res.code){
            case 1003:return 'Connect from ${__res.data.ip}';
            case 1000:return 'Connection from ${__res.data.ip} has been rejected';
        }},AFTER)
    onWsConnection(ws,im){
        //过滤客户端
        let ip=getAddressByIncomeMessage(im);
        if(this.filter(ip)){
            ws.close(1003,'block ip!');
            return {code:1003,data:{ip}};
        }
        return {code:1003,data:{ip}};
    }


    //, wsServer,turnServer构建并启动
    build(type,conf){
        if(type===this.TYPE_WS) {
            this.conf.ws=conf;
            this.wsServerBuild();
            this.call(this.WS_SERVER_CREATE);
        }
        if(type===this.TYPE_TURN){
            this.conf.turn=conf;
            this.turnServerBuild();
            this.call(this.TURN_SERVER_CREATE);
        }
    }

    //, wsServer,turnServer停止
    terminate(type){
        switch (type){
            case this.TYPE_TURN:this.turnServerTerminate();break;
            case this.TYPE_WEB:this.webServerTerminate();break;
            case this.TYPE_WS:this.wsServerTerminate();break;
        }
    }

    //, webServer启动
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

    //, webServer停止
    webServerTerminate(){
        this.webServer&&this.webServer.close();
    }

    //, wsServer启动
    wsServerBuild(){
        this.webServerBuild();
        if (!this.wsServer||this.wsServer._state!==0) {
            this.wsServer = new WebSocketServer({server: this.webServer});
            this.call(this.ON_WS_SERVER_CREATE);
        }
    }

    //, wsServer停止
    wsServerTerminate(){
        this.webServerTerminate();
        if(this.wsServer){
            this.wsServer.clients.forEach((ws)=>ws.terminate());
            this.wsServer.close();//close会等待连接关闭
        }
    }

    //, turn服务启动
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

    //, turn服务停止
    turnServerTerminate(){
        this.turnServer&&this.turnServer.stop();
    }


    //, 发送ping
    @log('${ws.clientID}: ping')
    ping(ws){
        ws.ping();
    }

    //, 生成id
    id(){
        //return crypto.randomUUID();
        return (++this.clientIDindex)+'';
    }

    //, 定时器
    interval(ms){
        let _this=this;
        return this.util()('wrap')(action=>{
            _this.timer=setInterval(action,ms);
        },true);
    }

    //, 事件监听
    on(type,callback,callee){
        let _this=this;
        let flat=this.util()('flat');
        switch (type){
            case 'ws-connection':      this.wsServer.on('connection',flat(_this.onWsConnection,callback));break;
            case 'ws-server-close':     this.wsServer.on('close',flat(_this.onWsServerClose,callback));break;
            case 'ws-pong':                callee.on('pong',(...arg)=>flat(_this.onWsPong,callback)(callee,...arg));break;
            case 'ws-message':          callee.on('message', flat(_this.onWsMessage,callback));break;
        }
    }

    //, 发送信息
    //from空则为服务器主动发出
    send(type,data,to,from='server'){
        let content={type,data,to,from,time:__time()};
        if(to) return this.unicast(content);
        else return this.broadcast(content);
    }

    //, 广播
    broadcast(data){
        this.wsServer&&this.wsServer.clients&&this.wsServer.clients.forEach((ws)=> {
            data.to=ws.clientID;
            return ws.send(JSON.stringify(data));
        });
    }

    //, 单播
    unicast(data){
        this.wsServer && this.wsServer.clients && this.wsServer.clients.forEach( (ws)=> {
            return ws.clientID === data.to && ws.send(JSON.stringify(data));
        });
    }

}

export {WsServerBuilder}