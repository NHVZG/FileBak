import {AFTER, log} from "@/backend/v2/utils/decorator";
import {RTCIceCandidate, RTCSessionDescription} from "wrtc";
import {WebSocket} from "ws";
import {__time} from "../utils/util";


class WsBuilder{
    TYPE_WS='ws';
    TYPE_RTC='rtc';
    TYPE_CHANNEL='channel';

    ON_WS_MESSAGE_SEND='onWsMessageSend';                                       //. ws消息接收事件
    ON_WS_CREATE='onWsCreate';                                                                  //. ws创建事件

    RTC_CREATE='rtcCreate';                                                                             //. webrtc 创建标识
    CHANNEL_CREATE='channelCreate';                                                          //. webrtc.通道创建标识

    constructor() {
        this.ws=null;
        this.rtc=null;
        this.channel=null;  //暂时只一对一
        this.conf=null;
        this.clientID=null;
        this.rtcRemoteClientID=null;
        this.timeoutTimer=null;

        this.funcMap={};
    }

    //` 简化工具方法
    util(){
        let _this=this;
        let func= {
            flat:(...func)=>{
                return (...arg)=>{
                    return func.filter(f=>f).reduce((r,f)=>f(...arg));
                }
            }
        }
        return (key)=>func[key]||((...arg)=>arg);
    }

    //` 注册回调方法
    register(key,callback,cover=false){
        if(!this.funcMap[key]||cover){
            this.funcMap[key]=callback;
        }
    }

    //` 调用方法
    call(key,...arg){
        return this.funcMap[key]&&this.funcMap[key](...arg);
    }


    @log('ws close')                                                                                                    //% 默认 - ws.close事件
    onWsClose(){
        clearTimeout(this.timeoutTimer);
    }

    @log('ws error')                                                                                                     //% 默认 - ws.error事件
    onWsError(){
        clearTimeout(this.timeoutTimer);
    }

    @log('ws open')                                                                                                    //% 默认 - ws.open事件
    onWsOpen(){}

    @log('ws ping')                                                                                                      //% 默认 - ws.ping事件
    onWsPing(){}

   onWsMessage(){}                                                                                                     //% 默认 - ws.message事件

    @log('rtc outgoing ice：${event.candidate.candidate}')                                     //% 默认 - rtc.onicecandidate事件
    onIceCandidate(event){}

    @log('rtc iceConnectionStateChange：${_this.rtc.connectionState}')                //% 默认 - rtc.iceconnectionstatechange事件
    onIceConnectionStateChange(){}

    @log('rtc iceGatheringStateChange: ${_this.rtc.iceGatheringState}')                  //% 默认 - rtc.icegatheringstatechange事件
    onIceGatheringStateChange(){}

    @log('rtc connectionStateChange: ${_this.rtc.connectionState}')                       //% 默认 - rtc.connectionstatechange事件
    onConnectionStateChange(){}

    @log('rtc signalingStateChange: ${_this.rtc.signalingState}')                              //% 默认 - rtc.signalingStateChange事件
    onSignalingStateChange(){}

    @log('rtc negotiation started')                                                                              //% 默认 - rtc.onNegotiationNeeded事件
    onNegotiationNeeded(){}

    @log('rtc tracking')                                                                                                 //% 默认 - rtc.onTrack事件
    onTrack(){}

    @log('rtc dataChannel...')                                                                                       //% 默认 - rtc.onDataChannel事件
    onDataChannel(){}

    @log('channel Open')                                                                                            //% 默认 - channel.onOpen事件
    onChannelOpen(){}

    @log('channel Close')                                                                                            //% 默认 - channel.onClose事件
    onChannelClose(){
        this.rtcClose();
    }

    @log('channel Error')                                                                                             //% 默认 - channel.onError事件
    onChannelError(){
        this.rtcClose();
    }

    @log('channel Message: ${event.data}')                                                               //% 默认 - channel.onMessage事件
    onChannelMessage(event){}

    //, rtc添加候选
    @log((iceCandidate)=>"rtc ice candidate add: " + JSON.stringify(iceCandidate))
    async addICE(iceCandidate){
        let rtcIceCandidate = new RTCIceCandidate(iceCandidate);
        await this.rtc.addIceCandidate(rtcIceCandidate);
    }

    //, rtc设置远程连接SDP
    async remoteSDP(sdp){
        return this.rtc.setRemoteDescription(new RTCSessionDescription(sdp));
    }

    //, rtc设置本地连接SDP
    async localSDP(sdp){
        return this.rtc.setLocalDescription(sdp);
    }

    //, rtc接收方创建本地SDP
    async createAnswer(){
        return this.rtc.createAnswer();
    }

    //, rtc发送方创建本地SDP（可指定接收音频或者视频）
    async createOffer(){
        let offer=await this.rtc.createOffer();
        if (this.rtc.signalingState !== "stable") {
            throw new Error("rtc connection isn't stable");
        }
        return offer;
    }

    //, rtc关闭连接
    @log(res=>res?'rtc closing the peer connection':'',AFTER)
    rtcClose(){
        if (this.rtc) {
            this.rtc.ontrack = null;
            this.rtc.ondatachannel = null;
            this.rtc.onicecandidate = null;
            this.rtc.onnotificationneeded = null;
            this.rtc.onsignalingstatechange = null;
            this.rtc.onicegatheringstatechange = null;
            this.rtc.oniceconnectionstatechange = null;

            //` 一个webrtc连接可以对应多个通道，单独处理transceivers
            this.rtc.getTransceivers().forEach(transceiver => transceiver.stop());

            this.rtc.close();
            this.rtc = null;
            return true;
        }
        return false;
    }

    //, 创建rtc连接
    rtcCreate(){
        if(!this.ws||['CONNECTING', 'CLOSING', 'CLOSED' /*'OPEN'*/].includes(this.ws._readyState)) {
            this.createWS();
        }
        this.call(this.RTC_CREATE);
    }


    //. rtc.channel关闭
    channelClose(){
        this.channel.close();
    }

    //. 创建rtc channel
    channelCreate(){
        if(!this.rtc||["closed" , /*"connected" ,*/ "connecting", "disconnected" , "failed" , "new"].includes(this.rtc.connectionState)){
            this.rtcCreate();
        }
        this.channel=this.rtc.createDataChannel('sendDataChannel');
        this.call(this.CHANNEL_CREATE);
    }

    //, ws关闭
    wsClose(){
        this.ws.terminate();
    }

    //, 创建ws连接
    wsCreate(){
        if(this.channel)this.channelClose();
        if(this.rtc)this.rtcClose();
        if(this.ws)this.wsClose();
        let {tls,host,port}=this.conf.ws;
        this.ws=new WebSocket(`${tls?'wss':'ws'}://${host}:${port}`);
        this.call(this.ON_WS_CREATE);
    }


    //.  计时器
    timeout(ms,callback){
        clearTimeout(this.timeoutTimer);
        this.timeoutTimer = setTimeout(callback,ms);
    }

    //. 通用连接方法
    connect(type,conf){
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;            //允许自签证书
        if(conf){
            this.conf=conf?{...this.conf,...conf}:this.conf;
            //this.iceServers=this.conf?.rtc?.iceServers||this.conf?.channel?.iceServers;
            if(this.conf&&this.conf.rtc&&this.conf.rtc.iceServers){
                this.iceServers=this.conf.rtc.iceServers;
            }
            else if(this.conf&&this.conf.channel&&this.conf.channel.iceServers){
                this.iceServers=this.conf.channel.iceServers;
            }
            if(conf.channel)this.conf.rtc=conf.channel;
            if(conf.rtcRemoteClientID)this.rtcRemoteClientID=conf.rtcRemoteClientID;
        }
        switch (type){
            case this.TYPE_WS:              return this.wsCreate();
            case this.TYPE_RTC:             return this.rtcCreate();
            case this.TYPE_CHANNEL:   return this.channelCreate();
        }
    }

    //. 事件监听
    on(type,callback,callee){
        let _this=this;
        let flat=this.util()('flat');
        switch (type){
            // ws
            case 'ws-close':                                            return this.ws.on('close',flat(_this.onWsClose,callback));
            case 'ws-open':                                            return this.ws.on('open',flat(_this.onWsOpen,callback));
            case 'ws-ping':                                             return this.ws.on('ping',flat(_this.onWsPing,callback));
            case 'ws-error':                                             return this.ws.on('error',flat(_this.onWsError,callback));
            case 'ws-message':                                      return this.ws.on('message', flat(_this.onWsMessage,callback));

            //rtc
            case 'rtc-ice-candidate':                            return this.rtc.onicecandidate=event=> {
                                                                                     if (!event.candidate) return;
                                                                                     _this.onIceCandidate(event);
                                                                                     return callback(event);
                                                                                 };
            case 'rtc-ice-connection-state-change':    return this.rtc.oniceconnectionstatechange=flat(_this.onIceConnectionStateChange,callback);
            case 'rtc-ice-gathering-state-change':       return this.rtc.onicegatheringstatechange=flat(_this.onIceGatheringStateChange,callback);
            case 'rtc-connection-state-change':           return this.rtc.onconnectionstatechange=flat(_this.onConnectionStateChange,callback);
            case 'rtc-signaling-state':                            return this.rtc.onsignalingstatechange=flat(_this.onSignalingStateChange,callback);
            case 'rtc-negotiation-needed':                   return this.rtc.onnegotiationneeded=flat(_this.onNegotiationNeeded,callback);
            case 'rtc-track':                                             return this.rtc.ontrack=flat(_this.onTrack);
            case 'rtc-data-channel':                               return this.rtc.ondatachannel=flat(_this.onDataChannel,callback);

            //channel
            case 'rtc-channel-open':                             return this.channel.onopen=flat(_this.onChannelOpen,callback);
            case 'rtc-channel-message':                       return this.channel.onmessage=flat(_this.onChannelMessage,callback);
            case 'rtc-channel-close':                             return this.channel.onclose=flat(_this.onChannelClose,callback);
            case 'rtc-channel-error':                             return this.channel.onerror=flat(_this.onChannelError,callback);

        }
    }

    //. 通用发送方法
    send(type,data,from,to){
        switch (type){
            case 'rtc-sdp-reply':
            case 'rtc-ice':
            case 'rtc-sdp-request':
            case 'ws-message-data':   break;
            case 'channel':                   return this.channel.send(data);
        }
        let json= {
            type,
            data,
            from:from||this.clientID,
            to:to||this.rtcRemoteClientID,
            time:__time()
        };
        this.ws.send(JSON.stringify(json));
        this.call(this.ON_WS_MESSAGE_SEND,json);
    }
}

export {WsBuilder}