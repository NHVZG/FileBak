import {api, listen, request} from "@/backend/v4/decorator/api";
import {EVENT,SERVICE,clientCenter} from "@/backend/v4/core/service/webrtcContainor";
import {initWebRTCClient} from "@/backend/v4/core/service/webrtc";
import {RtcHandler} from "@/backend/v4/decorator/rtc-handler";

@api("client")
class Client{

    @request("init")
    init(name){
        if(name){
            initWebRTCClient(name);
        }
    }

    @request("connect")
    connect(name,type,conf){
        let client=clientCenter.get(name);
        client.config(conf);
        client.remoteClientID=conf.remoteClientID;
        client.connect(type);
    }

    @request("send")
    send(name,type,data,to,from){
        let client=clientCenter.get(name);
        switch(type){
            case SERVICE.CLIENT_WS:                             client.sendWs(data,to,from);break;
            case SERVICE.CLIENT_RTC_CHANNEL:           client.sendChannel(data);break;
        }
    }

    @request("terminate")
    terminate(name,type){
        let client=clientCenter.get(name);
        switch (type){
            case SERVICE.CLIENT_WS:                         client.wsTerminate();break;
            case SERVICE.CLIENT_RTC:                        client.rtcClose();break;
            case SERVICE.CLIENT_RTC_CHANNEL:       client.channelClose();break;
        }
    }

    @request("state")
    state(name){
        return clientCenter.get(name).info();
    }


    //` 事件监听函数

    @listen({handler:new RtcHandler(SERVICE.CLIENT_WS,EVENT.WS_CONNECTED_$$)})
    onWsConnect(){}

    /*@listen()
    onWsMsgData(){}*/

    @listen({handler:new RtcHandler(SERVICE.CLIENT_WS,EVENT.WS_ERROR)})
    onWsError(){}

    @listen({handler:new RtcHandler(SERVICE.CLIENT_WS,EVENT.WS_CLOSE)})
    onWsClose(){}



    @listen({handler:new RtcHandler(SERVICE.CLIENT_RTC,EVENT.RTC_OPEN_$)})
    onRtcOpen(){}

    @listen({handler:new RtcHandler(SERVICE.CLIENT_RTC,EVENT.RTC_OPEN_ALLOW_$$)})
    onRtcConnected(){}

    @listen({handler:new RtcHandler(SERVICE.CLIENT_RTC,EVENT.RTC_CLOSE_$)})
    onRtcClose(){}

    @listen({handler:new RtcHandler(SERVICE.CLIENT_RTC,EVENT.RTC_ERROR_$$)})
    onRtcError(){}



    @listen({handler:new RtcHandler(SERVICE.CLIENT_RTC_CHANNEL,EVENT.RTC_CHANNEL_OPEN)})
    onChannelOpen(){}

    @listen({handler:new RtcHandler(SERVICE.CLIENT_RTC_CHANNEL,EVENT.RTC_CHANNEL_OPEN_ALLOW_$$)})
    onChannelConnected(){}

    /*@listen({handler:new RtcHandler(SERVICE.CLIENT_RTC_CHANNEL,EVENT.RTC_CHANNEL_DATA_$$)})
    onChannelMsgData(){}*/


    @listen({handler:new RtcHandler(SERVICE.CLIENT_RTC_CHANNEL,EVENT.RTC_CHANNEL_CLOSE)})
    onChannelClose(){}

    @listen({handler:new RtcHandler(SERVICE.CLIENT_RTC_CHANNEL,EVENT.RTC_CHANNEL_ERROR)})
    onChannelError(){}
}