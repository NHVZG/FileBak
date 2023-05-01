import {WsServerBuilder} from "../p2p/server";
import {WsBuilder} from "../p2p/client";
import {RTCIceCandidate, RTCPeerConnection, RTCSessionDescription} from "wrtc";

//onWsMessageCallBack(clientID, json.msg);

let server=null;
let client=null;



function createServer({onWsMessage=()=>{}}={},cover=false){
    let builder=new WsServerBuilder();

    builder.register(builder.MSG,data=>onWsMessage(data),cover);

    //{tls:true,cert:'',key:'',port:6503},
   //{username:'',password:'',port:5000}
    //builder.build({ws:ws,turn:turn});

    builder.register(builder.WS_SERVER_CREATE,()=> {

        //30秒检查一次，向客户端发送ping帧，收回pong帧标志激活状态，否则失活标志的连接关闭
        builder.interval(30000, ws => {
            if (ws.isAlive === false) return ws.terminate();
            ws.isAlive = false;
            builder.ping(ws);
        })('clients');

        builder.on('close');
        builder.on('connection', (ws, im) => {
            ws.isAlive = true;
            ws.clientID = builder.id();
            builder.send('signed',builder.data().signed(ws.clientID));
            builder.on('ws-message', (json) => {
                switch (json.type) {
                    case 'ice':
                    case 'sdp-request':
                    case 'sdp-reply':      return builder.send(json.type,builder.data().data(json.type, json.data, ws.clientID, json.to));
                    case 'message':       return builder.send(json.type,builder.data().message(json.data.message, ws.clientID));
                }
            }, ws);
            builder.on('ws-pong', (buffer) => ws.isAlive = true, ws);
        });
    },cover);
    return builder;
}




//onWsMessageCallBack

function createClient({
                          onChannelClose=(event)=>{},
                          onChannelError=(event)=>{},
                          onChannelOpen=(event)=>{},
                          onChannelMessage=(data,event,remoteClientID)=>{},
                          onWsMessage=(json)=>{},
                          onWsError=(event)=>{},
                          onWsClose=(event)=>{},
                          onWsConnect=(clientID,json)=>{},
                          onRTCConnect=(remoteClientID,json)=>{},
                          onRTCError=(event)=>{},
                          onRTCClose=(event)=>{} }={},cover=false){
    let builder=new WsBuilder();

    //. 连接
    //builder.connect(type,conf);
    //builder.connect({channel:{remoteClientID:'',ice:[]}});
    //builder.connect({rtc:{remoteClientID:'',ice:[]}});
    //builder.connect({ws:{tls:true,host:'',port:6503}});
    builder.register(builder.MSG,data=>onWsMessage(data),cover);

    //. 心跳
    builder.register('heartbeat',()=>{
        builder.timeout(30000+1000,()=>builder.wsClose());
    },cover);

    //. webrtc.channel 创建
    builder.register(builder.CHANNEL_CREATE,()=>{
        builder.channel.binaryType = 'arraybuffer';
        builder.on('rtc-channel-open',onChannelOpen);
        builder.on('rtc-channel-close',onChannelClose);
        builder.on('rtc-channel-error',onChannelError);
        builder.on('rtc-channel-message',event=>{
            onChannelMessage(event.data,event,builder.rtcRemoteClientID);//todo
        });
    },cover);

    //. websocket 创建
    builder.register(builder.WS_CREATE,()=> {
        builder.on('ws-error',onWsError);
        builder.on('ws-close',onWsClose);
        builder.on('ws-ping', () => builder.call('heartbeat'));
        builder.on('ws-open', () => builder.call('heartbeat'));
        builder.on('ws-message', async (data, isBinary) => {
            let json=JSON.parse(data.toString());
            switch (json.type) {
                case 'signed':              builder.clientID = json.to;
                                                    return onWsConnect(builder.clientID,json);
                case 'ws-message':     return builder.call(builder.MSG,json);
                case 'ice':                     return builder.addICE(json.data.candidate);
                case 'sdp-reply':          builder.rtcRemoteClientID=json.from;
                                                    await builder.remoteSDP(json.data.sdp);
                                                    return onRTCConnect(json.from,json);
                case 'sdp-request':     builder.rtcRemoteClientID=json.from;
                                                    if(!builder.rtc){
                                                        builder.call(builder.RTC_CREATE);
                                                    }
                                                    if (builder.rtc.signalingState !== "stable") {
                                                        return await Promise.all([
                                                            builder.localSDP({type:'rollback'}),
                                                            builder.remoteSDP(json.data.sdp)
                                                        ]);
                                                    }
                                                    let localSdp=await builder.createAnswer();
                                                    await builder.remoteSDP(json.data.sdp);
                                                    await builder.localSDP(localSdp);
                                                    return builder.send('sdp-reply',{sdp:builder.rtc.localDescription});
            }
        })
    },cover);

    //. webrtc 创建
    builder.register(builder.RTC_CREATE,()=>{
        builder.rtc=builder.conf.iceServers?
            new RTCPeerConnection({iceServers:builder.conf.iceServers}):
            new RTCPeerConnection();
        builder.on('rtc-ice-candidate', event => builder.send('ice',{candidate:event.candidate}));
        builder.on('rtc-ice-connection-state-change', () => {
            builder.option(builder.rtc.iceConnectionState,['closed','disconnected'])
                        .then(builder.rtcClose)
                        .then(onRTCClose);
            builder.option(builder.rtc.iceConnectionState,['failed'])
                        .then(builder.rtcClose)
                        .then(onRTCError);
        });
        builder.on('rtc-ice-gathering-state-change');
        builder.on('rtc-connection-state-change');
        builder.on('rtc-signaling-state', () => {
            builder.option(builder.rtc.signalingState,['closed'])
                        .then(builder.rtcClose)
                        .then(onRTCClose);
        });
        builder.on('rtc-negotiation-needed', async () => {
            let localSdp=await builder.createOffer();
            await builder.localSDP(localSdp);
            builder.send('sdp-request',{sdp: builder.rtc.localDescription});
        });
        builder.on('rtc-track');
        builder.on('rtc-data-channel',event=>{
            builder.channel=event.channel;
            builder.call(builder.CHANNEL_CREATE);
        });
    },cover);
    return builder;
}

function initServer(...arg){
    server=createServer(...arg);
    return server;
}
function initClient(...arg){
    client=createClient(...arg);
    return client;
}

export {
    initServer,
    initClient,
    createServer,
    createClient,
    server,
    client
}