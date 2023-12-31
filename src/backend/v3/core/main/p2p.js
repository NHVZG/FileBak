import {RTCPeerConnection} from "wrtc";
import {WsServerBuilder} from '../p2p/server';
import {WsBuilder} from '../p2p/client';


//. 创建服务端
function createServer({
                          wsMessageType={},                                                                                                  //. 自定义信息类型处理
                          onWsMessage=data=>{},
                          onWsMessageSend=data=>{} }={}){
    let builder=new WsServerBuilder();
    builder.register(builder.ON_WS_MESSAGE_SEND,onWsMessageSend);                                             //. 发送消息回调

    builder.register(builder.ON_WS_SERVER_CREATE,()=>{
        builder.interval(30000)('clients')(ws=>{                                                                                             //' 心跳检验 30秒检查一次，向客户端发送ping帧，收回pong帧(自动)标志激活状态，否则失活标志的连接关闭
            if(!ws.isAlive)return ws.terminate();
            ws.isAlive=false;
            builder.ping(ws);
        });
        builder.on('ws-server-close');
        builder.on('ws-connection',(ws,im)=>{
            ws.isAlive = true;
            ws.clientID = builder.id();
            builder.send('ws-signed', {clientID:ws.clientID},ws.clientID);                                                        //. ws登录server赋予clientID
            builder.on('ws-message', (json) => {
                let data=JSON.parse(json.toString());
                switch (data.type) {
                    case 'rtc-ice':                                                                                                                             //. ice交换
                    case 'rtc-sdp-request':                                                                                                              //. sdp请求转发
                    case 'rtc-sdp-reply':               return builder.send(data.type,data.data,data.to,data.from);  //. sdp回答转发
                    case 'ws-message-data':       if(data.to) {                                                                                //. ws信息，有目的地则转发，否则接收
                                                                        builder.send(data.type, data.data, data.to,data.from);
                                                                    }else {
                                                                        //builder.send(data.type, data.data);
                                                                        onWsMessage(data);
                                                                    }
                }
                wsMessageType[data.type]&&wsMessageType[data.type].map(f=>f(data,builder));            //. 自定义信息类型处理
            }, ws);
            builder.on('ws-pong', (buffer) => ws.isAlive = true, ws);
        });
    });
    return builder;
}


//. 创建客户端
function createClient({
                            name='',
                            channelMessageType={},                                                                                                                              //. 通道自定义信息类型处理
                            wsMessageType={},                                                                                                                                       //. 自定义信息类型处理
                            onWsConnect=(clientID,json)=>{},
                            onWsMessage=data=>{},
                            onWsMessageSend=data=>{},
                            onWsError=event=>{},
                            onWsClose=event=>{},
                            onRtcConnect=(remoteClientID,event)=>{},
                            onRtcError=event=>{},
                            onRtcClose=event=>{},
                            onChannelOpen=event=>{},
                            onChannelMessage=(data,event,remoteClientID)=>{},
                            onChannelError=event=>{},
                            onChannelClose=event=>{} }){
    let HEARTBEAT='heartbeat';

    let builder=new WsBuilder();
    builder.name=name;
    builder.register(HEARTBEAT,()=>builder.timeout(3000000+1000,()=>builder.wsClose()));

    builder.register(builder.ON_WS_MESSAGE_SEND,onWsMessageSend);

    builder.register(builder.CHANNEL_CREATE,()=>{                                                                                                                          //. webrtc通道创建事件
        builder.channel.binaryType = 'arraybuffer';
        builder.on('rtc-channel-open',(event)=>onChannelOpen(event));
        builder.on('rtc-channel-close',onChannelClose);
        builder.on('rtc-channel-error',onChannelError);
        builder.on('rtc-channel-message',event=>{
            let data=event.data instanceof Array?event.data:JSON.parse(event.data);
            if(data.type&&channelMessageType[data.type]){
                channelMessageType[data.type].map(f=>f(data,builder));
                return;
            }
            //默认调用
            onChannelMessage(data,event,builder.rtcRemoteClientID)
        });
    });

    builder.register(builder.ON_WS_CREATE,()=>{                                                                                                                               //. ws创建事件
        builder.on('ws-error',onWsError);
        builder.on('ws-close',onWsClose);
        builder.on('ws-ping', () => {
            builder.call(HEARTBEAT)
        });
        builder.on('ws-open', () => builder.call(HEARTBEAT));
        builder.on('ws-message', async (json, isBinary) => {
            let data=JSON.parse(json.toString());
            switch (data.type) {
                case 'ws-signed':                    builder.clientID = data.to;
                                                                onWsConnect(builder.clientID,data);break;

                case 'ws-message-data':        onWsMessage(data);break;

                case 'rtc-ice':                           await builder.addICE(data.data.candidate);break;

                case 'rtc-sdp-reply':                builder.rtcRemoteClientID=data.from;
                                                                await builder.remoteSDP(data.data.sdp);
                                                                onRtcConnect(data.from,data);break;

                case 'rtc-sdp-request':           builder.rtcRemoteClientID=data.from;
                                                                if(!builder.rtc||["closed" , "connected" , "connecting", "disconnected" , "failed"].includes(builder.rtc.connectionState)){ //' 有新请求 或 关闭状态则新建连接
                                                                    builder.call(builder.RTC_CREATE);
                                                                }
                                                                if (builder.rtc.signalingState !== "stable") {                                                                     //' 非stable的则回滚，退出，等待对方先发起协商
                                                                    return await Promise.all([                                                                                             //' 防止两端请求碰撞，同时发起导致协商失败，rollback可以回滚signalingState到stable状态(https://blog.mozilla.org/webrtc/perfect-negotiation-in-webrtc/)
                                                                        builder.localSDP({type:'rollback'}),
                                                                        builder.remoteSDP(data.data.sdp)
                                                                    ]);
                                                                }
                                                                await builder.remoteSDP(data.data.sdp);                                                                         //' 必须先设置remoteSDP才可createAnswer
                                                                let localSdp=await builder.createAnswer();                                                                      //' stable的则将自己作为被动方，设置sdp发送回应消息
                                                                await builder.localSDP(localSdp);
                                                                return builder.send('rtc-sdp-reply',{sdp:builder.rtc.localDescription});
            }
            wsMessageType[data.type]&&wsMessageType[data.type].map(f=>f(data,builder));                                                       //. 自定义信息类型处理
        })
    });

    builder.register(builder.RTC_CREATE,()=>{                                                                                                                                    //. webrtc创建事件
        builder.rtc=builder.conf.iceServers?
            new RTCPeerConnection({iceServers:builder.conf.iceServers}):
            new RTCPeerConnection();
        
        builder.on('rtc-ice-candidate', event => {
            builder.send('rtc-ice',{candidate:event.candidate})
        });
        builder.on('rtc-ice-connection-state-change', (event,...arg) => {
            if(!builder.rtc)return;
            switch (builder.rtc.iceConnectionState){
                case 'closed':
                case 'disconnected':     builder.rtcClose();
                                                       onRtcClose(builder.rtc?builder.rtc.iceConnectionState:'closed');break;
                case 'failed':                  builder.rtcClose();
                                                       onRtcError(builder.rtc?builder.rtc.iceConnectionState:'closed');break;
            }
        });
        builder.on('rtc-ice-gathering-state-change');
        builder.on('rtc-connection-state-change');
        builder.on('rtc-signaling-state', event => {
            switch (builder.rtc.signalingState){
                case 'closed':                  builder.rtcClose();
                                                        onRtcClose(builder.rtc.signalingState);break;
            }
        });
        builder.on('rtc-negotiation-needed', async () => {
            let localSdp=await builder.createOffer();
            await builder.localSDP(localSdp);
            builder.send('rtc-sdp-request',{sdp: builder.rtc.localDescription});
        });
        builder.on('rtc-data-channel',event=>{
            builder.channel=event.channel;
            builder.call(builder.CHANNEL_CREATE);
        });
        builder.on('rtc-track');
    });
    return builder;
}

export {
    createClient,
    createServer,
}