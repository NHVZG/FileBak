import {__flat, __data} from "../utils/util";
import {AFTER, log} from "../utils/decorator";
import {RTCIceCandidate, RTCPeerConnection, RTCSessionDescription} from "wrtc";
import {WebSocket} from "ws";

class WsBuilder{
    WS='ws';
    RTC='rtc';
    CHANNEL='channel';

    WS_CREATE='WS_CONNECTION_CREATE_EVENT';     //. ws连接创建事件
    RTC_CREATE='RTC_CONNECTION_CREATE_EVENT';   //. rtc连接创建事件
    CHANNEL_CREATE='RTC_CHANNEL_CREATE_EVENT';   //. rtc通道连接创建事件

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


    //` 数据构建
    data(){
        return __data();
    }

    //` if then
    option(match,...opt){
        return {
            then:(callback)=>{
                if(opt.includes(match))return callback();
            }
        }
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

    //% 默认 - ws.close事件
    @log('ws close')
    onWsClose(){
        clearTimeout(this.timeoutTimer);
    }

    //% 默认 - ws.error事件
    @log('ws error')
    onWsError(){
        clearTimeout(this.timeoutTimer);
    }

    //% 默认 - ws.open事件
    @log('ws open')
    onWsOpen(){}

    //% 默认 - ws.ping事件
    @log('ws ping')
    onWsPing(){}

    //% 默认 - ws.message事件
    onWsMessage(){}

    //% 默认 - rtc.onicecandidate事件
    @log('rtc outgoing ice：${event.candidate.candidate}')
    onIceCandidate(event){}

    //% 默认 - rtc.iceconnectionstatechange事件
    @log('rtc iceConnectionStateChange：${_this.rtc.connectionState}')
    onIceConnectionStateChange(){}

    //% 默认 - rtc.icegatheringstatechange事件
    @log('rtc iceGatheringStateChange: ${_this.rtc.iceGatheringState}')
    onIceGatheringStateChange(){}

    //% 默认 - rtc.connectionstatechange事件
    @log('rtc connectionStateChange: ${_this.rtc.connectionState}')
    onConnectionStateChange(){}

    //% 默认 - rtc.signalingStateChange事件
    @log('rtc signalingStateChange: ${_this.rtc.signalingState}')
    onSignalingStateChange(){}

    //% 默认 - rtc.onNegotiationNeeded事件
    @log('rtc negotiation started')
    onNegotiationNeeded(){}

    //% 默认 - rtc.onTrack事件
    @log('rtc tracking')
    onTrack(){}

    //% 默认 - rtc.onDataChannel事件
    @log('rtc dataChannel...')
    onDataChannel(){}

    //% 默认 - channel.onOpen事件
    @log('channel Open')
    onChannelOpen(){}

    //% 默认 - channel.onClose事件
    @log('channel Close')
    onChannelClose(){
        this.rtcClose();
    }

    //% 默认 - channel.onMessage事件
    @log('channel Message: ${event.data}')
    onChannelMessage(event){}


    //. rtc添加候选
    @log((res,iceCandidate)=>"rtc ice candidate add: " + JSON.stringify(iceCandidate))
    async addICE(iceCandidate){
        let rtcIceCandidate = new RTCIceCandidate(iceCandidate);
        await this.rtc.addIceCandidate(rtcIceCandidate);
    }

    //. rtc设置远程连接SDP
    async remoteSDP(sdp){
        return this.rtc.setRemoteDescription(new RTCSessionDescription(sdp));
    }

    //. rtc设置本地连接SDP
    async localSDP(sdp){
        return this.rtc.setLocalDescription(sdp);
    }

    //. rtc接收方创建本地SDP
    async createAnswer(){
        return this.rtc.createAnswer();
    }

    //. rtc发送方创建本地SDP（可指定接收音频或者视频）
    async createOffer(){
        let offer=await this.rtc.createOffer();
        if (this.rtc.signalingState !== "stable") {
            return throw new Error("rtc connection isn't stable");
        }
        return offer;
    }

    //. rtc关闭连接
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

    //. ws关闭
    wsClose(){
        this.ws.terminate();
    }

    //. rtc.channel关闭
    channelClose(){
        this.channel.close();
    }

    //. 创建ws连接
    createWS(){
        if(this.channel)this.channelClose();
        if(this.rtc)this.rtcClose();
        if(this.ws)this.wsClose();
        let {tls,host,port}=this.conf.ws;
        this.ws=new WebSocket(`${tls?'wss':'ws'}://${host}:${port}`);
        this.call(this.WS_CREATE);
    }

    //. 创建rtc连接
    createRTC(){
        if(!this.ws||['CONNECTING', 'CLOSING', 'CLOSED' /*,'OPEN'*/].contains(this.ws._readyState)) {
            this.createWS();
        }
        this.call(this.RTC_CREATE);
    }

    //. 创建rtc channel
    createChannel(){
        if(!this.rtc||["closed" , /*"connected" ,*/ "connecting", "disconnected" , "failed" , "new"].contains(this.rtc.connectionState)){
            this.createRTC();
        }
        this.channel=this.rtc.createDataChannel('sendDataChannel');
        this.call(this.CHANNEL_CREATE);
    }

    //. 通用连接方法
    connect(type,conf){
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;            //允许自签证书
        if(conf){
            this.conf=conf?{...this.conf,...conf}:this.conf;
            this.iceServers=this.conf?.rtc?.iceServers||this.conf?.channel?.iceServers;
            if(conf.channel)this.conf.rtc=conf.channel;
        }
        switch (type){
            case this.WS:return this.createWS();
            case this.RTC:return this.createRTC();
            case this.CHANNEL:return this.createChannel();
        }
    }

    //. 通用发送方法
    send(type,data){
        let remote=true;
        switch (type){
            case 'sdp-reply':
            case 'ice':
            case 'sdp-request':  remote=true;break;
            case 'ws-message':  remote=false;break;
            case 'channel':         return this.channel.send(data);
        }
        let content= {};
        content.type=type;
        content.data=data;
        content.from=this.clientID;
        if(remote)content.to=this.rtcRemoteClientID;
        this.ws.send(content);
    }

    //. 事件监听
    on(type,callback,callee){
        let _this=this;
        switch (type){
            // ws
            case 'ws-close':                                            return this.ws.on('close',__flat(_this.onWsClose,callback));
            case 'ws-open':                                            return this.ws.on('open',__flat(_this.onWsOpen,callback));
            case 'ws-ping':                                             return this.ws.on('ping',__flat(_this.onWsPing,callback));
            case 'ws-error':                                             return this.ws.on('error',__flat(_this.onWsError,callback));
            case 'ws-message':                                      return this.ws.on('message', __flat(_this.onWsMessage,callback));

            //rtc
            case 'ice-candidate':                                   return this.rtc.onicecandidate=event=> {
                                                                                     if (!event.candidate) return;
                                                                                     _this.onIceCandidate(event);
                                                                                     return callback(event);
                                                                                  }
            case 'rtc-ice-connection-state-change':     return this.rtc.oniceconnectionstatechange=__flat(_this.onIceConnectionStateChange,callback);
            case 'rtc-ice-gathering-state-change':       return this.rtc.onicegatheringstatechange=__flat(_this.onIceGatheringStateChange,callback);
            case 'rtc-connection-state-change':           return this.rtc.onconnectionstatechange=__flat(_this.onConnectionStateChange,callback);
            case 'rtc-signaling-state':                            return this.rtc.onsignalingstatechange=__flat(_this.onSignalingStateChange,callback);
            case 'rtc-negotiation-needed':                   return this.rtc.onsignalingstatechange=__flat(_this.onNegotiationNeeded,callback);
            case 'rtc-track':                                             return this.rtc.ontrack=__flat(_this.onTrack);
            case 'rtc-data-channel':                               return this.rtc.ondatachannel=__flat(_this.onDataChannel,callback);

            //channel
            case 'rtc-channel-open':                             return this.channel.onopen=__flat(_this.onChannelOpen,callback);
            case 'rtc-channel-message':                       return this.channel.onmessage=__flat(_this.onChannelMessage,callback);
            case 'rtc-channel-close':                             return this.channel.onclose=__flat(_this.onChannelClose,callback);

        }
    }

    //. 计时器
    timeout(ms,callback){
        clearTimeout(this.timeoutTimer);
        this.timeoutTimer = setTimeout(callback,ms);
    }

}

export {WsBuilder}