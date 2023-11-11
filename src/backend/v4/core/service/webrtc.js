import {WsServer, WsServerHelper} from "@/backend/v4/core/module/ws/server";
import {WebRTCClient,WebRTCClientHelper} from "@/backend/v4/core/module/rtc/client";
import {
    MSG,
    SERVICE,
    EVENT,

    serverCenter,
    msgCenter,
    clientCenter,
    wsServer,
    rtcEventListener, STATE,getEventListenerSet
} from "@/backend/v4/core/service/webrtcContainor";
import {TurnServer} from "@/backend/v4/core/module/turn/turn";



//. 初始化webrtc服务器
function initWebRTCServer(/*{
                              //;onWsServerMsgData=data=>{},                                                                                             //, websocket服务主动发消息回调
                              onWsServerMsgSend=data=>{}}={}*/name='server'){                                                                   //, websocket服务接收发消息回调
    serverCenter.setWsServer(new WsServer());
    serverCenter.setTurnServer(new TurnServer());
    let helper=new WsServerHelper(wsServer);
    Object.entries(getEventListenerSet(SERVICE.SERVER_WS,name,{})).map(e=>wsServer.on(e[0],e[1]));
    Object.entries(getEventListenerSet(SERVICE.SERVER_WEB,name,{})).map(e=>wsServer.on(e[0],e[1]));

    //;wsServer.on($$EVENT_WS_MSG_DATA,onWsServerMsgData);                                                                           //, websocket消息数据接收
    //wsServer.on(WsServer.$EVENT_WS_MSG_SEND,onWsServerMsgSend);                                                             //, websocket服务主动发消息事件


    wsServer.on(EVENT.WS_SERVER_TERMINATE,()=> helper.clearTimer('heartbeat'));                                 //, websocket服务停止事件
    wsServer.on(EVENT.WS_SERVER_STARTUP_$,()=>{                                                                                //, websocket服务启动事件
        helper.interval(30000,'heartbeat')(()=>{
          return helper.util.clients(wsServer,ws=>{
             // if(!ws.use)return ws.terminate();                                                                                                           //, 使用检测
             if(!ws.isAlive)return ws.terminate();                                                                                                           //, ping-pong网络心跳检测
             ws.isAlive=false;
             ws.use=false;
             helper.ping(ws);
          });
        });
    });
    wsServer.on(EVENT.WS_SERVER_CONNECTION,(ws,im)=>{                                                                  //, websocket连接事件
        ws.isAlive=true;
        ws.clientID = helper.id();
        wsServer.send({type:MSG.WS_SIGNED,clientID:ws.clientID},ws.clientID);                                                       //, 登录成功（长连接建立成功）
        wsServer.on(EVENT.WS_PONG,buffer=>ws.isAlive=true,ws);                                                                       //, websocket pong事件（心跳）
        wsServer.on(EVENT.WS_MSG,json=>{
            ws.use=true;
            let content=JSON.parse(json.toString());
            switch (content.data.type){
                case MSG.RTC_ICE:
                case MSG.RTC_SDP_REQUEST:
                case MSG.RTC_SDP_REPLAY:            return wsServer.send(content.data,content.to,content.from);
                //;case MSG_WS_DATA:                    if(content.to)  wsServer.send(content.data,content.to,content.from);     //, 转发到其他客户端数据消息
                //;                                                    else wsServer.call($$EVENT_WS_MSG_DATA,content);                            //, 服务器接收数据消息
            }
            msgCenter[SERVICE.SERVER_WS].get(content.data.type,[]).map(f=>f(content.data,content,ws,wsServer));                //, 自定义消息分发
        },ws);
    });
    return wsServer;
}


function initWebRTCClient(/*{
                              onWsConnect=(clientID,json)=>{},
                              onWsMsgSend=(data,from,to)=>{},
                              onWsMsgData=(data,from,to)=>{},
                              onWsError=event=>{},
                              onWsClose=event=>{},

                              onRtcConnected=(remoteClientID,data)=>{},
                              onRtcOpen=(rtc)=>{},
                              onRtcClose=event=>{},
                              onRtcError=event=>{},

                              onChannelOpen=data=>{},
                              onChannelConnected=data=>{},
                              onChannelMsgData=data=>{},
                              onChannelMsgSend=data=>{},
                              onChannelClose=event=>{},
                              onChannelError=event=>{},
                          }={},*/name){
    if(clientCenter.get(name))return clientCenter.get(name);
    let helper=new WebRTCClientHelper();
    let client=new WebRTCClient(name);
    clientCenter.set(name,client);
    Object.entries(getEventListenerSet(SERVICE.CLIENT_WS,name,{})).map(e=>client.on(e[0],e[1]));
    Object.entries(getEventListenerSet(SERVICE.CLIENT_RTC,name,{})).map(e=>client.on(e[0],e[1]));
    Object.entries(getEventListenerSet(SERVICE.CLIENT_RTC_CHANNEL,name,{})).map(e=>client.on(e[0],e[1]));

    let wsTimout=()=>helper.timeout(3000000+1000)(()=>client.wsTerminate());
    client.on(EVENT.WS_PING,wsTimout);                                                                     //, websocket ping事件
    client.on(EVENT.WS_OPEN,wsTimout);                                                                    //, websocket连接建立事件
    /*
    client.on($$EVENT_WS_CONNECTED,onWsConnect);                                               //, websocket连接成功事件
    client.on(WebRTCClient.$EVENT_WS_MSG_SEND,onWsMsgSend);                           //, websocket消息发送事件
    //;client.on($$EVENT_WS_MSG_DATA,onWsMsgData);                                                //, websocket数据接收事件
    client.on(WebRTCClient.EVENT_WS_ERROR,onWsError);                                          //, websocket错误事件
    client.on(WebRTCClient.EVENT_WS_CLOSE,onWsClose);                                          //, websocket关闭事件

    client.on(WebRTCClient.$EVENT_RTC_OPEN,onRtcOpen);                                        //, rtc连接建立事件（主动方）
    client.on($$EVENT_RTC_OPEN_ALLOW,onRtcConnected);                                        //, rtc连接建立事件（被动方）
    client.on(WebRTCClient.$EVENT_RTC_CLOSE,onRtcClose);                                       //, rtc连接关闭事件
    client.on($$EVENT_RTC_ERROR,onRtcError);                                                            //, rtc错误事件

    client.on(WebRTCClient.EVENT_RTC_CHANNEL_OPEN,onChannelOpen);                 //, rtc.channel建立事件（主动方）
    client.on($$EVENT_RTC_CHANNEL_OPEN_ALLOW,onChannelConnected);               //, rtc.channel建立事件（被动方）
    client.on(WebRTCClient.EVENT_RTC_CHANNEL_CLOSE,onChannelClose);                //, rtc.channel关闭事件
    client.on(WebRTCClient.EVENT_RTC_CHANNEL_ERROR,onChannelError);                //, rtc.channel错误事件
    client.on(WebRTCClient.$EVENT_RTC_CHANNEL_MSG_SEND,onChannelMsgSend); //, rtc.channel消息发送事件
    client.on($$EVENT_RTC_CHANNEL_DATA,onChannelMsgData);                               //, rtc.channel数据接收事件
    */

    client.on(EVENT.WS_MSG, async (json,isBinary)=>{//, json:{from,to,time,data:{type,...}}
        let content=JSON.parse(json.toString());
        let {data}=content;
        switch (data.type){
            case MSG.WS_SIGNED:                      client.clientID=data.clientID;
                                                                     client.call(EVENT.WS_CONNECTED_$$,data.clientID,data);
                                                                     break;
            //;case MSG_WS_DATA:                        client.call($$EVENT_WS_MSG_DATA,data);
            //;                                                          break;
            case MSG.RTC_ICE:                            await client.addICE(data.candidate);
                                                                     break;
            case MSG.RTC_SDP_REPLAY:              client.remoteClientID=content.from;
                                                                     await client.remoteSDP(data.sdp);
                                                                     client.call(EVENT.RTC_OPEN_ALLOW_$$,content.from,data);
                                                                     break;
            case MSG.RTC_SDP_REQUEST:           client.remoteClientID=content.from;
                                                                     let state=client.info().state.rtc;
                                                                     if(STATE.RTC.CLOSED===state||
                                                                         STATE.RTC.CONNECTED===state||
                                                                         STATE.RTC.CONNECTING===state||
                                                                         STATE.RTC.DISCONNECTED===state||
                                                                         STATE.RTC.FAILED===state){
                                                                         client.rtcCreate();
                                                                     }
                                                                     if (client.rtc.signalingState !== "stable") {                                                                     //, 非stable的则回滚，退出，等待对方先发起协商
                                                                        return await Promise.all([                                                                                        //, 防止两端请求碰撞，同时发起导致协商失败，rollback可以回滚signalingState到stable状态(https://blog.mozilla.org/webrtc/perfect-negotiation-in-webrtc/)
                                                                            client.localSDP({type:'rollback'}),
                                                                            client.remoteSDP(data.sdp)
                                                                        ]);
                                                                     }
                                                                     await client.remoteSDP(data.sdp);                                                                                //, 必须先设置remoteSDP才可createAnswer
                                                                     let localSdp=await client.createAnswer();                                                                      //, stable的则将自己作为被动方，设置sdp发送回应消息
                                                                     await client.localSDP(localSdp);
                                                                     return client.sendWs({type:MSG.RTC_SDP_REPLAY,sdp:client.rtc.localDescription});
        }
        msgCenter[SERVICE.CLIENT_WS].get(data.type,[]).map(f=>f(content.data,content,client));      //, 自定义信息类型处理,data:{type,...}
    });


    client.on(EVENT.RTC_ICE_CANDIDATE,event=>{
        client.sendWs({type:MSG.RTC_ICE,candidate:event.candidate});
    });
    client.on(EVENT.RTC_CONNECTION_STATE_CHANGE,(event,...arg)=>{
       if(!client.rtc)return;
       let state=client.info().state.ice;
       switch (state){
           case STATE.RTC.CLOSED:
           case STATE.RTC.DISCONNECTED:            client.rtcClose();
                                                                           break;
           case STATE.RTC.FAILED:                           client.rtcClose();
                                                                           client.call(EVENT.RTC_ERROR_$$,state);
                                                                           break;
       }
    });
    client.on(EVENT.RTC_SIGNALING_STATE, event => {
        let state=client.info().state.signaling;
        switch (state){
            case STATE.RTC.CLOSED:                         client.rtcClose();
        }
    });
    client.on(EVENT.RTC_NEGOTIATION_NEEDED, async () => {
        let localSdp=await client.createOffer();
        await client.localSDP(localSdp);
        client.sendWs({type:MSG.RTC_SDP_REQUEST,sdp: client.rtc.localDescription});
    });
    client.on(EVENT.RTC_DATA_CHANNEL,event=>{                    //, rtc.channel建立请求j接收事件（被动方）
        client.channel=event.channel;
        client.events.channel.map(f=>f());      //,被动方接收channel绑定事件
        client.call(EVENT.RTC_CHANNEL_OPEN_ALLOW_$$,event.channel);            //, rtc.channel建立事件（被动方）
    });

    client.on(EVENT.RTC_CHANNEL_MSG,event=>{                     //, rtc.channel消息接收事件
        let data=JSON.parse(event.data);
        if(data.type){                                                                                                          //, rtc.chanel信息分发
            msgCenter[SERVICE.CLIENT_RTC_CHANNEL].get(data.type,[]).map(f=>f(data,client)); //, data: {type,...}               按监听事件区分
        }
        //;client.call(EVENT.RTC_CHANNEL_DATA_$$,data,event,client)                                    //, rtc.channel数据接收     固定回调
    });

    //client.on(WebRTCClient.EVENT_RTC_GATHERING_STATE_CHANGE);
    //client.on(WebRTCClient.EVENT_RTC_CONNECTION_STATE_CHANGE);
    //client.on(WebRTCClient.EVENT_RTC_TRACK);
    return client;
}

export {
    initWebRTCServer,
    initWebRTCClient,

}