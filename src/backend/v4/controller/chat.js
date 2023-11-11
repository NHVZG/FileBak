import {
    channel,
    controller,
    message
} from "@/backend/v4/decorator/rtc";
import {api, listen, request} from "@/backend/v4/decorator/api";
import {EVENT, wsServer} from "@/backend/v4/core/service/webrtcContainor";
import {SERVICE,clientCenter} from "@/backend/v4/core/service/webrtcContainor";
import {RtcHandler,WsServerHandler} from "@/backend/v4/decorator/rtc-handler";

@controller()
@api("chat")
class ChatController{

    //` ==========服务端

    //. 消息监听
    @listen({fire:true,handler:new WsServerHandler(SERVICE.SERVER_WS,'ws-msg')})
    @message("ws-msg",SERVICE.SERVER_WS)
    onWsServerMsg(data,content,server){
        return content;
    }

    //. 消息转发
    @message("ws-msg-transfer",SERVICE.SERVER_WS)
    onWsServerMsgTransfer(data,content,server){
        data.type='ws-msg';
        wsServer.send(data,content.to,content.from);
    }

    //. 消息发送
    @request("sendWsServerMsg")
    sendWsServerMsg(data,to,from){
        wsServer.send({data,type:'ws-msg'},to,from);
    }

    //. 消息已发送
    @listen({handler:new WsServerHandler(SERVICE.SERVER_WS,EVENT.WS_MSG_SEND_$)})
    onWsServerMsgSend(){}

    //` ==========客户端

    //. 消息监听
    @listen({fire:true,handler:new RtcHandler(SERVICE.CLIENT_WS,'ws-msg')})
    @message("ws-msg",SERVICE.CLIENT_WS)
    onWsMsg(data,content,client){
        return content;
    }

    //. 消息发送
    @request("sendWsMsg")
    sendWsMsg(name,data,to,from){
        clientCenter.get(name).sendWs({data,type:'ws-msg'},to,from)
    }

    //. 转发消息发送
    @request()
    sendTransferWsMsg(name,data,to,from){
        clientCenter.get(name).sendWs({data,type:'ws-msg-transfer'},to,from)
    }

    //. 消息已发送
    @listen({handler:new RtcHandler(SERVICE.CLIENT_WS,EVENT.WS_MSG_SEND_$)})
    onWsMsgSend(){}

    //` =============webrtc-channel

    @listen({fire:true,handler:new RtcHandler(SERVICE.CLIENT_RTC_CHANNEL,'channelMsg')})
    @channel("channel-msg")
    onChannelMsg(data,client){
        return data;
    }

    @request("sendChannelMsg")
    sendChannelMsg(name,data){
        clientCenter.get(name).sendChannel({data,type:'channel-msg'});
    }


    @listen({handler:new RtcHandler(SERVICE.CLIENT_RTC_CHANNEL,EVENT.RTC_CHANNEL_MSG_SEND_$)})
    onChannelMsgSend(){}
}