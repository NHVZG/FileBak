import {ElMessage, ElNotification} from "element-plus";

//` 服务类型
const SERVICE={
    SERVER_WS:'SERVER_WS',                                                                                                 //, websocket服务端
    SERVER_WEB:'SERVER_WEB',                                                                                             //, web服务端
    CLIENT_WS:"CLIENT_WS",                                                                                                 //, websocket客户端
    CLIENT_RTC:"CLIENT_RTC",                                                                                               //, webrtc连接客户端
    CLIENT_RTC_CHANNEL:"CLIENT_RTC_CHANNEL",                                                              //, webrtc-channel客户端
}


class Client{
    name=null;
    vue=null;
    clientID=null;
    remoteClientID=null;

    constructor(name,{
        onChannelMsg,

        onWsMsg,
        onWsMsgSend,
        onWsConnect,
        onWsError,
        onWsClose}={},conf,vue) {
        this.vue=vue;
        this.conf=conf;
        this.name=name;
        this.states={
            clientID:'',
            remoteClientID:'',
            ws:'',
            rtc:'',
            channel:'',
        };
        if(onWsMsg)window.chat.onWsMsg(this.name,onWsMsg);
        if(onWsMsgSend)window.chat.onWsMsgSend(this.name,onWsMsgSend);
        if(onChannelMsg)window.chat.onChannelMsg(this.name,onChannelMsg);
        //window.client.onWsConnect(this.name,onWsConnect||this.onWsConnect.bind(this));  //不可绑定this，否则绑定class实例而不是代理对象 无法达到响应式
        window.client.onWsConnect(this.name,onWsConnect||this.onWsConnect);
        window.client.onWsError(this.name,onWsError||this.onWsError);
        window.client.onWsClose(this.name,onWsClose||this.onWsClose);
        this.init();
    }

    sendWs=(text,to)=>{
        if(to){//, 服务端转发
            window.chat.sendTransferWsMsg(this.name, {text},to,this.clientID);
        }else {//, 发送给服务端
            window.chat.sendWsMsg(this.name, {text});
        }
    }

    async sync(){
        let info=await this.state();
        this.clientID=info.clientID;
        this.remoteClientID=info.remoteClientID;
        this.states.ws=info.state.ws;
        this.states.rtc=info.state.rtc;
        this.states.channel=info.state.channel;
    }

    onWsConnect(clientID,data){
        this.clientID=clientID;
        ElMessage(`ws connected:${clientID}`);
    }

    send(text,to){
        this.states.channel==='OPEN'&&this.remoteClientID?
            this.sendChannel(text,to):
            this.sendWs(text,to);
    }

    connectWs=(conf=this.conf)=>window.client.connect(this.name,SERVICE.CLIENT_WS,conf)
    connectRtc=(conf=this.conf)=>window.client.connect(this.name,SERVICE.CLIENT_RTC,conf)
    connectChannel=(conf=this.conf)=>{
        if(!conf.remoteClientID)return;
        window.client.connect(this.name,SERVICE.CLIENT_RTC_CHANNEL,conf)
    }

    closeWs=()=> window.client.terminate(this.name,SERVICE.CLIENT_WS)
    closeRtc=()=> window.client.terminate(this.name,SERVICE.CLIENT_RTC)
    closeChannel=()=> window.client.terminate(this.name,SERVICE.CLIENT_RTC_CHANNEL)

    //. 创建客户端实例
    init=()=>window.client.init(this.name)
    state=()=>window.client.state(this.name)
    sendChannel=(text)=>window.chat.sendChannelMsg(this.name,{text})
    onWsError=(clientID,data)=>ElMessage(`ws ${clientID} error`)
    onWsClose=(clientID,data)=>ElMessage(`ws ${clientID} close`)
}


class Server{
    vue=null;
    constructor({
        onWsServerMsgSend,
        onWsServerMsg}={},conf,vue) {
        this.vue=vue;
        this.conf=conf;
        this.name='server';
        this.states={
            web:'CLOSED',
            ws:'CLOSED',
            port:null
        };
        if(onWsServerMsg)window.chat.onWsServerMsg(onWsServerMsg);
        if(onWsServerMsgSend)window.chat.onWsServerMsgSend(onWsServerMsgSend);
        //this.sync();          //会导致响应式失效
    }

    async sync(){
        let states=await this.state();
        this.states.web=states.web;
        this.states.ws=states.ws;
        this.states.port=states.port;
    }

    state=()=>window.wsServer.state()
    terminate=()=>window.wsServer.terminate()
    sendWs=(text)=>window.chat.sendWsServerMsg({text})
    startup=(conf=this.conf)=>window.wsServer.startup({...conf})

}

export {
    Server,
    Client
}