import {WsMsgType,WsServerMsgType,ChannelMsgType} from "../bridge-p2p";
import {ChannelMsgTypeTest} from "../bridge-test";

const MESSAGE_WS=0;
const MESSAGE_WS_SERVER=1;
const MESSAGE_RTC_CHANNEL=2;
const MESSAGE_RTC_CHANNEL_TEST=3;

//rtc.channel信息监听注解
function channel(type,clientType){
    return (target,name,descriptor)=> {
        switch (clientType){
            case MESSAGE_RTC_CHANNEL:                    ChannelMsgType[type]=WsMsgType[type]||[];
                                                                                    ChannelMsgType[type].push(descriptor.value);
                                                                                    break;
            case MESSAGE_RTC_CHANNEL_TEST:           ChannelMsgTypeTest[type]=ChannelMsgTypeTest[type]||[];
                                                                                    ChannelMsgTypeTest[type].push(descriptor.value);
                                                                                     break;
        }
    }
}

//' 注解本质是编译时执行的方法，利用其作为扫描注解方法
//ws信息监听注解
function message(type,clientName,msgType=MESSAGE_WS){
    return (target,name,descriptor)=> {
        switch (msgType){
            case MESSAGE_WS:                    WsMsgType[type]=WsMsgType[type]||[];
                                                                 WsMsgType[type].push(descriptor.value);
                                                                 break;
            case MESSAGE_WS_SERVER:     WsServerMsgType[type]=WsServerMsgType[type]||[];
                                                                 WsServerMsgType[type].push(descriptor.value);
                                                                 break;
        }
    }
}


export {
    channel,
    message,
    MESSAGE_WS,
    MESSAGE_WS_SERVER
}