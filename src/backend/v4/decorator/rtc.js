import {WebRTCClient} from "@/backend/v4/core/module/rtc/client";
import {metadata} from "@/backend/v4/util/util";
import {msgCenter,SERVICE} from "@/backend/v4/core/service/webrtcContainor";

let metadataGroup='controller';

//. 类注解，统一客户端类型
//, 与@api联用时在@api前定义
function controller(clientType){
    return (target,name,descriptor)=>{
        let register=metadata(target,target,metadataGroup)
        if(register)register.map(r=>r(clientType));
    }
}

//. webrtc注册自定义消息
function channel(event){              //, event：事件名
    return (target,name,descriptor)=>{
        metadata(target.constructor,target.constructor,metadataGroup,[])
            .push(()=>msgCenter[SERVICE.CLIENT_RTC_CHANNEL].set(event,descriptor.value));
    }
}


//. 回复webrtc消息
function channelReply(){                                    //,客户端类型
    return (target,name,descriptor)=>{
        let func = descriptor.value;
        descriptor.value = async function (...args) {
            let result=await func.apply(this,args);

            let client=args[args.length-1];
            if(client instanceof WebRTCClient){
                client.sendChannel(result);
            }
            return result;
        }
    }
}


//. websocket自定义消息
function message(event,msgType){               //, msgType：自定义消息名，客户端类型
    return (target,name,descriptor)=>{
        metadata(target.constructor,target.constructor,metadataGroup,[])
            .push((m=msgType)=>msgCenter[m].set(event,descriptor.value));
    }
}


//. 回复websocket消息
function messageReply(){
    return (target,name,descriptor)=>{
        let func = descriptor.value;
        descriptor.value = function (...args) {
            let result=func.apply(this,args);

            let client=args[args.length-1];
            if(client instanceof WebRTCClient){
                client.sendWs(result);
            }
            return result;
        }
    }
}

function dispatch(){

}

export {
    controller,
    channel,
    channelReply,
    message,
    messageReply
}