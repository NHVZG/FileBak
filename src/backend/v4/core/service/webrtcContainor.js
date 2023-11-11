import {triggerRtcInit} from "@/backend/v4/init/init";
import {bridge} from "@/backend/v4/init/bridge";

//`====websocket基础消息
const MSG={
    WS_SIGNED:'WS_SIGNED',                                                                                                //, websocket连接成功消息
    //;WS_DATA:'WS_DATA',                                                                                                       //, websocket数据消息
    RTC_ICE:'RTC_ICE',                                                                                                            //, webrtc-ice交换转发消息
    RTC_SDP_REQUEST:'RTC_SDP_REQUEST',                                                                          //, webrtc-sdp请求转发消息
    RTC_SDP_REPLAY:'RTC_SDP_REPLAY',                                                                               //, webrtc-sdp回复转发消息
}

//`====原始事件， $内部自定义事件，$$外部自定义事件
const EVENT={
    //, wsServer
    WEB_REQUEST:'WEB_REQUEST',                                                                                       //, web请求
    WEB_SERVER_STARTUP_$:'WEB_SERVER_STARTUP_$',                                                       //, web服务启动
    WEB_SERVER_TERMINATE_$:'WEB_SERVER_TERMINATE_$',                                               //, web服务停止
    WS_PONG:'WS_PONG',                                                                                                    //, websocket服务接收pong事件
    WS_SERVER_STARTUP_$:'WS_SERVER_STARTUP_$',                                                           //, websocket服务启动
    WS_SERVER_TERMINATE:'WS_SERVER_TERMINATE',                                                         //, websocket服务关闭
    WS_SERVER_CONNECTION:'WS_SERVER_CONNECTION',                                                 //, websocket连接请求
    //,ws
    WS_MSG:'WS_MSG',                                                                                                         //, websocket接收事件
    WS_PING:'WS_PING',                                                                                                        //, websocket接收ping事件
    WS_OPEN:'WS_OPEN',                                                                                                      //, websocket开启事件
    WS_CLOSE:'WS_CLOSE',                                                                                                    //, websocket关闭事件
    WS_ERROR:'WS_ERROR',                                                                                                   //, websocket错误事件
    WS_MSG_SEND_$:'WS_MSG_SEND_$',                                                                              //, websocket发送事件
    //,rtc
    RTC_TRACK:'RTC_TRACK',                                                                                                 //, 数据通道传输事件(rtc)
    RTC_OPEN_$:'RTC_OPEN_$',                                                                                             //, rtc连接开启事件
    RTC_CLOSE_$:'RTC_CLOSE_$',                                                                                           //, rtc连接关闭事件
    RTC_ICE_CANDIDATE:'RTC_ICE_CANDIDATE',                                                                    //, ice-candidate交换初始化
    RTC_DATA_CHANNEL:'RTC_DATA_CHANNEL',                                                                   //, 自定义数据通道事件
    RTC_SIGNALING_STATE:'RTC_SIGNALING_STATE',                                                             //, 信令服务器协商状态变动事件
    RTC_NEGOTIATION_NEEDED:'RTC_NEGOTIATION_NEEDED',                                             //, 信令服务器协商状态变动事件
    RTC_GATHERING_STATE_CHANGE:'RTC_GATHERING_STATE_CHANGE',                             //, ice-candidate 采集状态
    RTC_CONNECTION_STATE_CHANGE:'RTC_CONNECTION_STATE_CHANGE',                      //, 连接状态发生变化（有新的通道加入RTCRtpReceiver时）
    RTC_ICE_CONNECTION_STATE_CHANGE:'RTC_ICE_CONNECTION_STATE_CHANGE',         //, ice-connection连接变动事件（ice-connection在检测网络变动，如stun/turn切换之类）
    //,rtc.channel
    RTC_CHANNEL_MSG:'RTC_CHANNEL_MSG',                                                                      //, webrtc.channel接收事件
    RTC_CHANNEL_OPEN:'RTC_CHANNEL_OPEN',                                                                   //, webrtc.channel开启事件
    RTC_CHANNEL_CLOSE:'RTC_CHANNEL_CLOSE',                                                                 //, webrtc.channel关闭事件
    RTC_CHANNEL_ERROR:'RTC_CHANNEL_ERROR',                                                                //, webrtc.channel错误事件
    RTC_CHANNEL_MSG_SEND_$:'RTC_CHANNEL_MSG_SEND_$',                                            //, webrtc.channel发送事件
    //,自定义外部
    RTC_ERROR_$$:'RTC_ERROR_$$',                                                                                        //, rtc 错误
    WS_CONNECTED_$$:'WS_CONNECTED_$$',                                                                       //, websocket连接完成事件
    RTC_OPEN_ALLOW_$$:'RTC_OPEN_ALLOW_$$',                                                                  //, rtc连接完成事件（被动方）
    //;RTC_CHANNEL_DATA_$$:'RTC_CHANNEL_DATA_$$',                                                          //, rtc.channel数据接收
    RTC_CHANNEL_OPEN_ALLOW_$$:'RTC_CHANNEL_OPEN_ALLOW_$$',                                //, rtc.channel建立请求事件（被连接方）
    //;const $$EVENT_WS_MSG_DATA='$$EVENT_WS_MSG_DATA';                                         //, websocket数据接收
}

//` 状态
const STATE={
    WS_SERVER:{                                                                                                //, websocket服务器
        RUNNING:'RUNNING',
        CLOSING:'CLOSING',
        CLOSED:'CLOSED'
    },
    WEB_SERVER:{                                                                                              //, web服务器
        RUNNING:'RUNNING',
        CLOSED:'CLOSED'
    },
    TURN:{                                                                                                         //,turn服务器
        RUNNING:'RUNNING',
        CLOSED:'CLOSED'
    },
    WS:{                                                                                                             //, websocket客户端
        CONNECTING:'CONNECTING',
        OPEN:'OPEN',
        CLOSING:'CLOSING',
        CLOSED:'CLOSED'
    },
    RTC:{                                                                                                            //, webrtc客户端
        CLOSED:'CLOSED',
        CONNECTED:'CONNECTED',
        CONNECTING:'CONNECTING',
        DISCONNECTED:'DISCONNECTED',
        FAILED:'FAILED',
        NEW:'NEW'
    },
    RTC_CHANNEL:{                                                                                           //, webrtc-channel状态
        CLOSED:"CLOSED",
        CLOSING:"CLOSING",
        CONNECTING:"CONNECTING",
        OPEN:"OPEN"
    }
}


//` 服务类型
const SERVICE={
    SERVER_WS:'SERVER_WS',                                                                                                 //, websocket服务端
    SERVER_WEB:'SERVER_WEB',                                                                                             //, web服务端
    CLIENT_WS:"CLIENT_WS",                                                                                                 //, websocket客户端
    CLIENT_RTC:"CLIENT_RTC",                                                                                               //, webrtc连接客户端
    CLIENT_RTC_CHANNEL:"CLIENT_RTC_CHANNEL",                                                              //, webrtc-channel客户端
}

let clientsSet= {};                                                                                        //, 客户端实例
let wsServer;                                                                                                    //, websocket服务器实例
let turnServer;                                                                                                  //, turn服务器实例



class MsgItem{
    constructor() {
        this.MsgSet={};
    }

    set(event,action){
        if (!this.MsgSet[event]) this.MsgSet[event] = [];
        this.MsgSet[event].push(action);
    }

    get(event,defaults){
        return this.MsgSet[event]||defaults;
    }
}

const msgCenter={
    [SERVICE.SERVER_WS]: new MsgItem(),                                                        //, websocket服务端消息类型采集
    [SERVICE.CLIENT_WS]: new MsgItem(),                                                         //, websocket客户端消息类型采集
    [SERVICE.CLIENT_RTC_CHANNEL]: new MsgItem(),                                       //, webrtc-channel端消息类型采集
};

const rtcEventListener={                                                                        //, 前端监听事件采集（api有限，实例有多个，监听事件时通过相同的api按客户端，服务端的标识名区分调度）
    [SERVICE.SERVER_WS]:{},                                                                              //,{event:[]}
    [SERVICE.SERVER_WEB]:{},
    [SERVICE.CLIENT_WS]:{},                                                                               //, {name:{event:[callback]}} : name：监听者标识，event：事件，callback：回调
    [SERVICE.CLIENT_RTC]:{},
    [SERVICE.CLIENT_RTC_CHANNEL]:{}
};

const clientCenter={    //, 客户端获取
    get:(name)=>clientsSet[name||'client'],
    set:(name,client)=>clientsSet[name]=client
}

const serverCenter={
    setWsServer:(server)=>wsServer=server,
    setTurnServer:(server)=>turnServer=server
}


//. 获得实例指定事件监听器
function getEventListener(service,name,event,defaults){
    if(!rtcEventListener[service])return defaults;
    if(!rtcEventListener[service][name])return defaults;
    return rtcEventListener[service][name][event]||defaults;
}

//. 获得实例所有事件监听集合
function getEventListenerSet(service,name,defaults){
    if(!rtcEventListener[service])return defaults;
    return rtcEventListener[service][name]||defaults;
}

//. 注册监听事件
function registerListener(service,name,event,trigger){
    if(!rtcEventListener[service])rtcEventListener[service]={}
    if(!rtcEventListener[service][name])rtcEventListener[service][name]={};
    rtcEventListener[service][name][event]=trigger;
}

export {
    msgCenter,
    clientCenter,
    serverCenter,
    rtcEventListener,

    turnServer,
    wsServer,

    MSG,
    SERVICE,
    EVENT,
    STATE,

    getEventListenerSet,
    getEventListener,
    registerListener,
}