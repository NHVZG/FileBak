import {FBU_CONF,INIT_TYPE_MAIN,INIT_TYPE_RENDER} from "./config/config-center";
import {createClient} from "./main/p2p";
import {render,main} from "./bridge";

let client1,client2;

function getClient(name){
    return name==='client1'?client1:client2;
}

function initMain2Render(initType){
    let test=name=>({
        onWsConnect:main('testWsClient','onWsConnect','test-onWsConnect',name),
        //onWsMessage:main('testWsClient','onWsMessage','test-onWsMessage',name),
        //onWsMessageSend:main('testWsClient','onWsMessageSend','test-onWsMessageSend',name),
        onWsError:main('testWsClient','onWsError','test-onWsError',name),
        onWsClose:main('testWsClient','onWsClose','test-onWsClose',name),
        onRtcConnect:main('testWebrtc','onRtcConnect','test-onRtcConnect',name),
        onRtcError:main('testWebrtc','onRtcError','test-onRtcError',name),
        onRtcClose:main('testWebrtc','onRtcClose','test-onRtcClose',name),
        onChannelOpen:main('testWebrtc','onChannelOpen','test-onChannelOpen',name),
        onChannelMessage:main('testWebrtc','onChannelMessage','test-onChannelMessage',name),
        onChannelError:main('testWebrtc','onChannelError','test-onChannelError',name),
        onChannelClose:main('testWebrtc','onChannelClose','test-onChannelClose',name),
    });

    let client1Conf=test('client1');
    let client2Conf=test('client2');

    if(initType===INIT_TYPE_MAIN) {
        client1 = createClient(client1Conf);
        client2 = createClient(client2Conf);
    }
}



function initRender2Main(initType){
    render('testWsClient',{
        connect:                         (name,conf)=>getClient(name).connect(getClient(name).TYPE_WS,{ws:conf}),
        send:                               (name,{message})=>getClient(name).send('ws-message', {message}),
        terminate:                      name=>getClient(name).wsClose()
    });

    render('testWebrtc',{
        rtcConnect:                    (name,data)=>getClient(name).connect(getClient(name).TYPE_RTC,{
                                                    rtcRemoteClientID:data.remoteClientID,
                                                    rtc: {
                                                        iceServers:FBU_CONF.rtc.iceServers
                                                    }
                                                }),
        rtcTerminate:                  name=>getClient(name).rtcClose(),
        channelConnect:           (name,data)=>getClient(name).connect(getClient(name).TYPE_CHANNEL,{
                                                    rtcRemoteClientID:data.remoteClientID,
                                                    channel: {
                                                        iceServers:FBU_CONF.rtc.iceServers
                                                    }
                                                }),
        channelSend:                (name,data)=>getClient(name).send('channel',data),
        channelTerminate:       name=>getClient(name).channelClose()
    });
}


function initTest(initType){
    initMain2Render(initType);
    initRender2Main(initType);
}

export {
    initTest,
    initMain2Render,
    initRender2Main
}

