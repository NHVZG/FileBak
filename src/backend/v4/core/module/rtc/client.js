import {WebSocket} from "ws";
import {RTCPeerConnection, RTCSessionDescription,RTCIceCandidate} from "wrtc";
import {log} from "@/backend/v4/decorator/log";
import * as Util from "@/backend/v4/util/util";
import {EVENT,SERVICE,STATE} from "@/backend/v4/core/service/webrtcContainor";


class WebRTCClient{
    remoteClientID;
    clientID;
    channel;

    //, conf:{ws:{},rtc:{iceServers:[]}}
    constructor(name) {
        this.listener= {};                                                                                        //, 事件监听
        this.conf=null;                                                                                          //, 连接配置

        this.clientID=null;                                                                                     //, websocket客户端id
        this.remoteClientID=null;                                                                         //, webrtc远程客户端id
        this.ws=null;                                                                                             //, websocket连接
        this.rtc=null;                                                                                             //, webrtc连接
        this.channel=null;                                                                                     //, webrtc连接通道
        this.name=name||'';                                                                                  //, 标识
        this.events={
            ws:[],                                                                                                     //, websocket创建后事件
            rtc:[],                                                                                                     //, webrtc创建后事件
            channel:[]                                                                                             //, webrtc.channel创建后事件
        }
    }

    config(conf){
        if(conf)this.conf=conf;
    }

    //. 连接
    connect(type,...arg){
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;                         //, 允许自签证书
        switch (type){
            case SERVICE.CLIENT_WS:                        return this.wsCreate(...arg);
            case SERVICE.CLIENT_RTC:                       return this.rtcCreate(...arg);
            case SERVICE.CLIENT_RTC_CHANNEL:      return this.channelCreate(...arg);
        }
    }

    //.事件监听
    on(event,rawCallback,callee){
        let _this=this;
        let callback=(...arg)=>{
            return rawCallback(...arg,_this);
        }
        switch (event){
            case EVENT.WS_CLOSE:                                                 return this.events.ws.push(()=>this.ws.on('close',Util.combine(this.onWsClose,(...arg)=>callback(_this.clientID,...arg))));
            case EVENT.WS_OPEN:                                                  return this.events.ws.push(()=>this.ws.on('open',Util.combine(this.onWsOpen,(...arg)=>callback(_this.clientID,...arg))));
            case EVENT.WS_PING:                                                   return this.events.ws.push(()=>this.ws.on('ping',Util.combine(this.onWsPing.bind(this),callback)));
            case EVENT.WS_ERROR:                                                 return this.events.ws.push(()=>this.ws.on('error',Util.combine(this.onWsError.bind(this),callback)));
            case EVENT.WS_MSG:                                                    return this.events.ws.push(()=>this.ws.on('message',Util.combine(this.onWsMsg.bind(this),callback)));
            case EVENT.RTC_ICE_CANDIDATE:                                 return this.events.rtc.push(()=>this.rtc.onicecandidate=Util.combine(this.onIceCandidate.bind(this),callback));
            case EVENT.RTC_ICE_CONNECTION_STATE_CHANGE:    return this.events.rtc.push(()=>this.rtc.oniceconnectionstatechange=Util.combine(this.onIceConnectionStateChange.bind(this),callback));
            case EVENT.RTC_GATHERING_STATE_CHANGE:              return this.events.rtc.push(()=>this.rtc.onicegatheringstatechange=Util.combine(this.onIceGatheringStateChange.bind(this),callback));
            case EVENT.RTC_CONNECTION_STATE_CHANGE:          return this.events.rtc.push(()=>this.rtc.onconnectionstatechange=Util.combine(this.onConnectionStateChange.bind(this),callback));
            case EVENT.RTC_SIGNALING_STATE:                             return this.events.rtc.push(()=>this.rtc.onsignalingstatechange=Util.combine(this.onSignalingStateChange.bind(this),callback));
            case EVENT.RTC_NEGOTIATION_NEEDED:                     return this.events.rtc.push(()=>this.rtc.onnegotiationneeded=Util.combine(this.onNegotiationNeeded.bind(this),callback));
            case EVENT.RTC_TRACK:                                               return this.events.rtc.push(()=>this.rtc.ontrack=Util.combine(this.onTrack.bind(this),callback));
            case EVENT.RTC_DATA_CHANNEL:                                return this.events.rtc.push(()=>this.rtc.ondatachannel=Util.combine(this.onDataChannel.bind(this),callback));
            case EVENT.RTC_CHANNEL_OPEN:                                return this.events.channel.push(()=>this.channel.onopen=Util.combine(this.onChannelOpen.bind(this),callback));
            case EVENT.RTC_CHANNEL_MSG:                                  return this.events.channel.push(()=>this.channel.onmessage=Util.combine(this.onChannelMessage.bind(this),callback));
            case EVENT.RTC_CHANNEL_CLOSE:                               return this.events.channel.push(()=>this.channel.onclose=Util.combine(this.onChannelClose.bind(this),callback));
            case EVENT.RTC_CHANNEL_ERROR:                              return this.events.channel.push(()=>this.channel.onerror=Util.combine(this.onChannelError.bind(this),callback));
            default:                                                                         this.listener[event]=callback;
        }
    }

    //.ws发送数据
    sendWs(data,to,from){
        let source=from||this.clientID;
        let target=to||this.remoteClientID||'server';
        let content={
            from:source,
            to:target,
            time:Util.time(),
            data
        }
        this.ws.send(JSON.stringify(content));
        this.call(EVENT.WS_MSG_SEND_$,content,source,target);
    }

    //. rtc.channel发送数据
    sendChannel(data){
        this.channel.send(JSON.stringify(data));
        this.call(EVENT.RTC_CHANNEL_MSG_SEND_$,data);
    }

    //. rtc添加候选
    @log(iceCandidate=>iceCandidate&&("rtc ice candidate add: " + JSON.stringify(iceCandidate)))
    async addICE(iceCandidate){
        if(!iceCandidate)return;
        let rtcIceCandidate = new RTCIceCandidate(iceCandidate);
        await this.rtc.addIceCandidate(rtcIceCandidate);
    }

    //. rtc设置对方的SDP
    async remoteSDP(sdp){
        return this.rtc.setRemoteDescription(new RTCSessionDescription(sdp));
    }

    //. rtc设置本地SDP
    async localSDP(sdp){
        return this.rtc.setLocalDescription(sdp);
    }

    //. rtc发送方创建本地SDP（可指定接收音频或者视频）
    async createOffer(){
        let offer=await this.rtc.createOffer();
        if (this.rtc.signalingState !== "stable") {
            throw new Error("rtc connection isn't stable");
        }
        return offer;
    }

    //. rtc接收方创建本地SDP
    async createAnswer(){
        return this.rtc.createAnswer();
    }

    //. ws创建
    wsCreate(){
        if(this.ws)this.wsTerminate();
        let {tls,host,port}=this.conf.ws;
        this.ws=new WebSocket(`${tls?'wss':'ws'}://${host}:${port}`);
        this.events.ws.map(f=>f());
    }

    //. ws关闭
    wsTerminate(){
        this.ws.terminate();
    }

    //. rtc创建
    rtcCreate(){
        if(!this.ws
            ||STATE.WS.CLOSED===this.ws._readyState
            ||STATE.WS.CLOSING===this.ws._readyState
            ||STATE.WS.CONNECTING===this.ws._readyState){
            this.wsCreate();
        }
        this.rtc=this.conf.rtc&&this.conf.rtc.iceServers?
            new RTCPeerConnection({iceServers:this.conf.rtc.iceServers}):
            new RTCPeerConnection();
        this.call(EVENT.RTC_OPEN_$,this.rtc);
        this.events.rtc.map(f=>f());
    }

    //. rtc关闭
    @log(res=>res?'rtc closing the peer connection':'', log.AFTER)
    rtcClose(){
        if(!this.rtc) return false;
        this.rtc.ontrack = null;
        this.rtc.onicecandidate = null;
        this.rtc.ondatachannel = null;
        this.rtc.onnotificationneeded = null;
        this.rtc.onsignalingstatechange = null;
        this.rtc.onicegatheringstatechange = null;
        this.rtc.oniceconnectionstatechange = null;

        this.rtc.getTransceivers().forEach(transceiver => transceiver.stop());       //, 一个webrtc连接可以对应多个通道，单独处理transceivers

        this.rtc.close();
        this.rtc = null;
        this.call(EVENT.RTC_CLOSE_$);
        return true;
    }

    //. rtc.channel创建
    channelCreate(binaryType='arraybuffer'){
        if(!this.rtc)this.rtcCreate();
        this.channel=this.rtc.createDataChannel('sendDataChannel',{ordered:true});
        this.channel.binaryType = binaryType;
        this.events.channel.map(f=>f());
    }

    //. rtc.channel关闭
    channelClose(){
        this.channel.close();
    }

    //.客户端状态
    info(){
        return{
            clientID:this.clientID,
            remoteClientID:this.remoteClientID,
            state:{
                ws:this.ws?STATE.WS[Object.values(STATE.WS)[this.ws._readyState]]:STATE.WS.CLOSED,
                rtc:this.rtc?STATE.RTC[this.rtc.connectionState.toUpperCase()]:STATE.RTC.CLOSED,
                ice:this.rtc?STATE.RTC[this.rtc.iceConnectionState.toUpperCase()]:STATE.RTC.CLOSED,
                signaling:this.rtc?STATE.RTC[this.rtc.signalingState.toUpperCase()]:STATE.RTC.CLOSED,
                channel:this.channel?STATE.RTC_CHANNEL[this.channel.readyState.toUpperCase()]:STATE.RTC_CHANNEL.CLOSED
            }
        }
    }



    //` ==========默认事件-rtc

    @log(res=>res?'rtc outgoing ice：${event.candidate.candidate}':'',log.AFTER)
    onIceCandidate(event){
        return event.candidate;
    }

    @log('rtc iceConnectionStateChange：${this.rtc.iceConnectionState}',log.AFTER)
    onIceConnectionStateChange(){}

    @log('rtc iceGatheringStateChange: ${this.rtc.iceGatheringState}')
    onIceGatheringStateChange(){}

    @log('rtc connectionStateChange: ${this.rtc.connectionState}',log.AFTER)
    onConnectionStateChange(){}

    @log('rtc signalingStateChange: ${this.rtc.signalingState}')
    onSignalingStateChange(){}

    @log('rtc negotiation started')
    onNegotiationNeeded(){}

    @log('rtc tracking')
    onTrack(){}

    @log('rtc dataChannel...')
    onDataChannel(){}

    //` ==========默认事件-rtc.channel

    @log('channel Open')
    onChannelOpen(){}

    @log('channel Close')
    onChannelClose(){}

    @log('channel Error')
    onChannelError(){}

    @log('channel Message: ${event.data}')
    onChannelMessage(event){}


    //` ==========默认事件-websocket

    @log('ws open')
    onWsOpen(){}

    @log('ws ping')
    onWsPing(){}

    onWsMsg(){}

    @log('ws error')
    onWsError(){}

    @log('ws close')
    onWsClose(){}

    //' 调用事件
    call(key,...arg){
        return this.listener[key]&&this.listener[key](...arg);
    }
}

class WebRTCClientHelper{
    constructor() {
        this.timer=null;                                                                                         //,连接超时定时器
        this.util={
            wrap: (outer) => {
                return (inner) => outer(inner);
            }
        };
    }

    //. 连接超时计时器
    timeout(ms){
        clearTimeout(this.timer);
        let _this=this;
        return this.util.wrap(action=>_this.timer=setTimeout(action,ms));
    }

}

export {
    WebRTCClient,
    WebRTCClientHelper
}