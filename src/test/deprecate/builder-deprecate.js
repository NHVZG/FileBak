/*import {WebSocket, WebSocketServer} from 'ws';
import https from "https";
import http from "http";
import crypto from "crypto";
import {__log} from "../utils/util";*/

function getAddressByIncomeMessage(im){
    let remoteAddr=im.headers['x-forwarded-for'] || im.socket.remoteAddress;                             //` im.connection.remoteAddress
    return remoteAddr.substring(0, 7) === "::ffff:"?remoteAddr.substring(7):remoteAddr;             //` ::ffff:127.0.0.1  -  ::ffff: 是ipv6地址
}

function getSocketByClientID(wsServer,clientID){
    let websocket;
    wsServer&&wsServer.clients&&wsServer.clients.forEach(ws=>{
        if(ws.clientID===clientID)websocket=ws;
    });
    return websocket;
}

class BuilderDeprecate {
    constructor({tls,key,cert,port,blocks,log=true}) {
        this.tls=tls;
        this.log=log;
        this.key=key;
        this.cert=cert;
        this.port=port;
        this.blocks=blocks;
        this.webServer=null;
        this.wsServer=null;
    }
    logging(content,success){
        this.log&&__log(content,success);
    }

    webServerBuild(){
        if(!this.webServer||(!this.webServer.listening)){
            const {tls,key,cert,port,logging}=this;
            this.webServer =tls && key && cert?
                https.createServer({key,cert},this.request):
                http.createServer({},this.request);
            let _this=this;
            this.webServer.listen(port, function(){
                _this.logging(`Server is listening on port ${port}`)
            });
        }
    }
    wsServerBuild(){
        this.webServerBuild();
        if (!this.wsServer||this.wsServer._state!==0) {
            this.wsServer = new WebSocketServer({server: this.webServer});
        }
    }

    wsServerTerminate(){
        this.webServer&&this.webServer.close();
        if(this.wsServer){
            this.wsServer.clients.forEach((ws)=>ws.terminate());
            this.wsServer.close();//close会等待连接关闭
        }
    }


    request(request,response){
        /*if(req.url==='/client'){
               res.write(fs.readFileSync('./index.html'));
               res.end();
               return;
           }*/
        this.logging ("Received request for " + response.url);
        response.writeHead(404);
        response.end();
    }

    onWsServerClose(){
        this.logging('WebSocket Server is closing');
    }

    onWsServerConnection(ws,im){
        //过滤客户端
        let ip=getAddressByIncomeMessage(im);
        if(this.filter(ip)){
            ws.close(1003,'block ip!');
            return this.logging(`Connection from ${ip} has been rejected`);
        }
        this.logging(`connect from ${ip}-->${ws.clientID}`);
        //接受客户端请求
    }

    onWsMessage(data,isBinary){
        let json = JSON.parse(data.toString());
    }

    wsBroadcast(data){
        return this.wsServer&&this.wsServer.clients&&this.wsServer.clients.forEach(function(ws) {
            return ws.send(JSON.stringify(data));
        });
    }

    wsUnicast(receiver,data){
        return this.wsServer && this.wsServer.clients && this.wsServer.clients.forEach(function (ws) {
            return ws.clientID === receiver && ws.send(JSON.stringify(data));
        });
    }



    filter(ip){
        if(!this.blocks||this.blocks.length<1)return false;
        return this.blocks.includes(ip);
    }

}



class WsServerWrapper{
    build(conf){
        if (this.wsServer) {
            this.wsServer.wsServerTerminate();
        }
        this.wsServer = new BuilderDeprecate(conf);
        this.wsServer.wsServerBuild();
        return this;
    }

    id(){
        return crypto.randomUUID();
    }

    state(type,ws){
        switch (type){
            case 'alive':return ws.isAlive;
            case 'dead':return !ws.isAlive;
        }
    }

    setState(type,value,ws){
        ws[type]=value;
    }

    ping(ws){
        ws.ping();
    }

    terminate(ws){
        ws.terminate();
    }

    interval(ms,callback){
        this.schdule=setInterval(()=>{
            callback();
        },ms);
    }



    wsServerCloseListen(){
        let _this=this;
        this.wsServer.wsServer.on('close',()=>{
            _this.wsServer.onWsServerClose();
            clearInterval(_this.schdule);
        });
    }

    wsServerConnectionListen(callback){
        let _this=this;
        this.wsServer.wsServer.on('connection',(ws,...arg)=>{
            _this.wsServer.onWsServerConnection(ws,...arg);
            callback(ws,...arg);
        });
    }

    wsMessageListen(ws,callback){
        ws.on('message',(data,isBinary)=>{
            let clientID=ws.clientID;//this.clientID;
            let json = JSON.parse(data.toString());
            callback(ws,json,clientID);
        });
    }

    wsPongListen(ws){
        let _this=this;
        ws.on('pong',(data,isBinary)=> {
            ws.isAlive = true;
            this.wsServer.logging(`${ws.clientID}:pong`);
        });
    }

    wsBroadcast(data){
        return this.wsServer.wsBroadcast(data);
    }

    wsUnicast(receiver,data){
        return this.wsServer.wsUnicast(receiver,data);
    }


}


class WsServerBuilder{
    constructor() {
        this.wrapper=new WsServerWrapper();
    }

    build(conf){
        return ()=>this.wrapper.build(conf);
    }

    interval(ms,callback){
        return ()=>this.wrapper.interval(ms,callback);
    }

    wsServer(callback){
        return (...arg)=>callback(this.wrapper,...arg);
    }

    ws(callback,callee){
        //return callee instanceof WebSocketServer?
        return callee ==='wsServer'?
            (wsServerWrapper,...arg)=>{
                return wsServerWrapper.wsServer.wsServer.clients.forEach((ws)=>callback(ws,...arg,wsServerWrapper))
            }:     //传递上层参数
            (ws,...arg)=>callback(ws,...arg);
    }

    // ws

    alive(){
        return (ws)=>this.wrapper.setState('isAlive',true,ws);
    }

    is(type,callback){
        return (ws)=>this.wrapper.state(type,ws)&&callback(ws);
    }

    terminate(){
        return ws=>ws.terminate();
    }

    ping(){
        return ws=>ws.ping();
    }

    id(){
        return (ws)=>{
            ws.isAlive=true;
            ws.clientID=this.wrapper.id();
        }
    }

    send(type){
        let data;
        switch (type){
            case 'signed':data=(ws)=>({type,clientID:ws.clientID});break;
        }
        return (ws)=>{
            ws.send(JSON.stringify(data(ws)));
        }
    }


    type(msgType,callback){
        switch (msgType){
            case 'message':     return (ws,json,clientID)=>callback({type:'message',clientID,msg:json.msg});
            case 'ice':               return (ws,json,clientID)=>callback({type:'ice',data:json.msg});
            case 'sdp-send':    return (ws,json,clientID)=>callback(json.to,{type:'sdp-send',data:json.msg});
            case 'sdp-receive':return (ws,json,clientID)=>callback(json.to,{type:'sdp-send',data:json.msg});
        }
    }

    // wsServer
    broadcast(){
        return (wsServerWrapper,data)=>this.wrapper.wsBroadcast(data);
    }

    unicast(){
        return (wsServerWrapper,targetClientID,data)=>this.wrapper.wsUnicast(targetClientID,data);
    }

    on(event,callback,callee){
        if(callee === 'wsServer'){
            switch (event){
                case 'close':return ()=>this.wrapper.wsServerCloseListen();
                case 'connection':return ()=>this.wrapper.wsServerConnectionListen(callback);
            }
        }else{
            switch (event){
                case 'message':return (ws)=>this.wrapper.wsMessageListen(ws,callback);
                case 'pong':return (ws)=>this.wrapper.wsPongListen(ws);
            }
        }
    }
}






function analysis(struct){
    let func;
    let args;
    if(struct.arg){
        args=[];
        for( let a of struct.arg){
            if(a!=null&&typeof a==='object') {
                a._callee = struct.name;//标志调用者
            }
            let arg=a==null||a._ignore?a:analysis(a);
            args.push(arg);
        }
    }
    if(struct.cmd){
        let cmds=struct.cmd.map(c=>{
            c._callee=struct.name||'wsServer';//标志调用者
            return analysis(c);
        });
        if(struct._arg){
            func=(caller)=>{
                cmds.map(c=>{
                    return c(caller)
                });
            }
        }else{
            func=()=>{
                cmds.map(c=>{
                    return c()
                });
            }
        }
    }
    let a=struct.name?'1':'0';
    let b=args?'1':'0';
    let c=func?'1':'0';
    let d=struct._holder?'1':'0';
    let res= {
       '0000': ()=>struct,
       '0010': ()=>func,
       '1000': ()=>action[struct.name](),
       '1100': ()=>action[struct.name](...args),
       '1010': ()=>action[struct.name](func),
       '1001': ()=>action[struct.name](struct._callee),
       '1110': ()=>action[struct.name](...args,func),
       '1011': ()=>action[struct.name](func,struct._callee),
       '1101': ()=>action[struct.name](...args,struct._callee),
       '1111': ()=>action[struct.name](...args,func,struct._callee),
    }[(a+b+c+d)]
    return res();
}

let struct={cmd:[
        {name:'build',arg:[{tls:true,key:'',cert:'',port:6503}]},
        {
            name:'interval',
            arg:[
                30000,
                {
                    name:'wsServer',
                    arg:[
                        {
                            name:'ws',
                            // _ignore:true,  //. 是否忽略解析子结构
                            _holder:true,
                            _arg:true,          //.cmd是否接收参数
                            cmd:[
                                {name:'is',arg:['alive',{name:'ping'}]},
                                {name:'is',arg:['dead',{name:'terminate'}]}]
                        }
                    ]
                }
            ]
        },
        {name:'on',_holder:true,arg:['close',null]},
        {name:'on',_holder:true,arg:['connection',
                {name:'ws',_arg:true,_holder:true,cmd:[
                        {name:'id'},
                        {name:'on',_holder:true,arg:['message',{
                                name:'ws',
                                _arg:true,
                                _holder:true,
                                cmd:[
                                    {name:'type',arg:['message',{name:'wsServer',_holder:true,arg:[{name:'broadcast'}]}]},
                                    {name:'type',arg:['ice',{name:'wsServer',_holder:true,arg:[{name:'unicast'}]}]},
                                    {name:'type',arg:['sdp-send',{name:'wsServer',_holder:true,arg:[{name:'unicast'}]}]},
                                    {name:'type',arg:['sdp-receive',{name:'wsServer',_holder:true,arg:[{name:'unicast'}]}]}
                                ]
                            }]},
                        {name:'on',_holder:true,arg:['pong',{name:'alive'}]},
                        {name:'send',arg:['signed']}
                ]}
            ]}
    ]};


class Builder{
    constructor(receiver,prevBuilder) {
        this.receiver=receiver;
        this.prevBuilder=prevBuilder;
    }

    recursion(func){
        let _this=this;
        let receiver=_this.receiver?
            arg=>_this.receiver(func(arg)):
            func;
        return new Builder(receiver,this);
    }

    build(conf){
        return {name:'build',arg:[conf]};
    }

    interval(ms){
        let func=arg=>({name:'interval',arg:[ms,arg]});
        return this.recursion(func)
    }
    wsServer(){
        let func=arg=>({name:'wsServer',arg:[arg]})
        return this.recursion(func);
    }
    ws(){
        let cmds=[];
        let _this=this;
        let func=(cmd)=>{
            if(cmd===true){
                return {name:'ws',_holder:true, _arg:true,cmd:cmds};
            }
            cmds.push(cmd);
            return func;
        }
        return this.recursion(func);
    }

    is(type){
        let func=arg=>({name:'is',arg:[type,arg]})
        return this.recursion(func);
    }

    terminate(){
        this.receiver({name:'terminate'});
        return this.prevBuilder;
    }

    ping(){
        this.receiver({name:'ping'});
        return this.prevBuilder;
    }

    collspse(){
        return this.receiver(true);
    }

    on(type,a){
        if(a!==undefined)return {name:'on',_holder:true,arg:[type,a]};
        let func=arg=>({name:'on',_holder:true,arg:[type,arg]})
        return this.recursion(func);
    }
    id(){
        this.receiver({name:'id'});
        return this.prevBuilder;
    }

    type(type){
        let func=arg=>({name:'type',arg:[type,arg]})
        return this.recursion(func);
    }

    broadcast(){
        this.receiver({name:'broadcast'});
        return this.prevBuilder;
    }
    unicast(){
        this.receiver({name:'unicast'});
        return this.prevBuilder;
    }

    alive(){
        this.receiver({name:'alive'});
        return this.prevBuilder;
    }

    send(type){
        this.receiver({name:'send',arg:[type]});
        return this.prevBuilder;
    }
}


let builder=new Builder();
let cmds=[
    builder.build({tls:true,key:'',cert:'',port:6503}),
    builder
        .interval(1000)
        .wsServer()
        .ws()
        .is('alive').ping()
        .is('dead').terminate()
        .collspse(),
    builder.on('close',null),
    /*
   builder.on('connection')
        .ws()
        .on('message')
            .ws()
                .id()
                .type('message').wsServer().broadcast()
                .type('ice').wsServer().unicast()
                .type('sdp-send').wsServer().unicast()
                .type('sdp-receive').wsServer().unicast()
            .collspse()
            .on('pong').alive()
            .send('signed')
        .collspse()*/
];




let action=new WsServerBuilder();
let func= analysis(struct)

//export {func};