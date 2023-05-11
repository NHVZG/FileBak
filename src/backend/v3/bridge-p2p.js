import {FBU_CONF, INIT_TYPE_MAIN, INIT_TYPE_RENDER} from "./config/config-center";
import {main, render} from "./bridge";
import {createClient, createServer} from "./core/main/p2p";

const WsMsgType={};                     //客户端自定义ws信息解析
const WsServerMsgType={};          //服务端自定义ws信息解析
let server;
let client;

//, main进程调用render
function initMain2Render(){
    let serverConf={
        wsMessageType:WsServerMsgType,
        onWsMessage:main('wsServer','onMessage'),
        onWsMessageSend:main('wsServer','onMessageSend')
    };
    let clientConf={
        wsMessageType:WsMsgType,
        onWsConnect:main('wsClient','onWsConnect'),
        onWsMessage:main('wsClient','onWsMessage'),
        onWsMessageSend:main('wsClient','onWsMessageSend'),
        onWsError:main('wsClient','onWsError'),
        onWsClose:main('wsClient','onWsClose'),
        onRtcConnect:main('webrtc','onRtcConnect'),
        onRtcError:main('webrtc','onRtcError'),
        onRtcClose:main('webrtc','onRtcClose'),
        onChannelOpen:main('webrtc','onChannelOpen'),
        onChannelMessage:main('webrtc','onChannelMessage'),
        onChannelError:main('webrtc','onChannelError'),
        onChannelClose:main('webrtc','onChannelClose')
    };
    return {serverConf,clientConf};
}

//, render进程调用main
function initRender2Main({server,client}={}){
    //turn服务器
    render('turn',{
        startup:                          data=>server.build(server.TYPE_TURN,{...FBU_CONF.turn}),
        terminate:                      data=>server.terminate(server.TYPE_TURN)
    });
    //websocket服务端
    render('wsServer',{
        startup:                          data=>server.build('ws',{...FBU_CONF.ws.server}),
        terminate:                      data=>server.terminate(server.TYPE_WS),
        send:                              ({message})=>server.send('ws-message-data',{message})
    });
    //websocket客户端
    render('wsClient',{
        connect:                         conf=>client.connect(client.TYPE_WS,{ws:conf}),
        send:                              ({message})=>client.send('ws-message-data', {message}),
        terminate:                      data=>client.wsClose()
    });
    //webrtc p2p
    render('webrtc',{
        rtcTerminate:             data=>client.rtcClose(),
        rtcConnect:                data=>client.connect(client.TYPE_RTC,{
                                                rtcRemoteClientID:data.remoteClientID,
                                                rtc: {
                                                    iceServers:FBU_CONF.rtc.iceServers
                                                }
                                            }),
        channelConnect:        data=>client.connect(client.TYPE_CHANNEL,{
                                                rtcRemoteClientID:data.remoteClientID,
                                                channel: {
                                                    iceServers:FBU_CONF.rtc.iceServers
                                                }
                                            }),
        channelSend:             data=>client.send('channel',data),
        channelTerminate:     data=>client.channelClose()
    });
}

function initP2P(initType){
    switch (initType){
        case INIT_TYPE_MAIN:            let conf=initMain2Render();
                                                           server=createServer(conf.serverConf);
                                                           client=createClient(conf.clientConf);
                                                           initRender2Main({server,client});
                                                           break;

        case INIT_TYPE_RENDER:        initMain2Render();
                                                           initRender2Main();
                                                           break;
    }
}

export {initP2P,server,client,WsMsgType,WsServerMsgType}