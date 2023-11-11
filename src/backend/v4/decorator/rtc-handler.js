import {triggerRtcInit} from "@/backend/v4/init/init";
import {bridge} from "@/backend/v4/init/bridge";
import {getEventListener, registerListener} from "@/backend/v4/core/service/webrtcContainor";

//% webrtc 需要特殊处理实例处理api-listen
class RtcHandler{
    service;
    event;
    constructor(service,event) {
        this.service=service;                                                                                  //, 标识
        this.event=event;                                                                                      //, 事件
    }

    generate(channel,listenWrapper,oldApi){
        let trigger=(result,...args)=>{                                                         //, main线程执行
            let holder=args[args.length-1];
            let trigger=getEventListener(this.service,holder.name,this.event);
            if(trigger)trigger(result);
        };
        let listener=(name,callback)=>{                                                     //, render线程执行
            let instanceChannel=`${channel}_${name}`;
            triggerRtcInit(this.service,name,this.event,instanceChannel);                  //, 需先注册事件监听后再调用initWebRTCClient初始化（因为前端api有限，需要再监听时传入name标识区分客户端再分发）
            listenWrapper(instanceChannel)(callback);
        };
        return {trigger,listener};
    }

}

//% ws-server 需要特殊处理实例处理api-listen
class WsServerHandler{
    service;
    event;
    constructor(service,event) {
        this.service=service;                                                                                  //, 标识
        this.event=event;                                                                                      //, 事件
        this.name='server';
    }

    generate(channel,listenWrapper,oldApi){
        let trigger=(result,...args)=>{
            let holder=args[args.length-1];
            let trigger=getEventListener(this.service,holder.name||this.name,this.event);
            if(trigger)trigger(result);
        };
        registerListener(this.service,this.name,this.event,bridge.trigger(`${channel}_${this.name}`));
        let listener=(callback,name)=>{
            let instanceChannel=`${channel}_${name||this.name}`;
            if(name)triggerRtcInit(this.service,name,this.event,instanceChannel);
            listenWrapper(instanceChannel)(callback);
        };
        return {trigger,listener};
    }
}

export {
    RtcHandler,
    WsServerHandler
}