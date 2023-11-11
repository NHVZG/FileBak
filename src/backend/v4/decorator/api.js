import {bridge} from "@/backend/v4/init/bridge";
import {metadata} from "@/backend/v4/util/util";
import 'reflect-metadata';                                                                               //,引入空间

let API={};

let metadataGroup='api';

//. 采集api用于初始化client,server
function gatherAPI(group,api,trigger){
    if(!API[group])API[group]={};
    API[group][api]=trigger;
}


//. 类注解-注册前端api分组
//, 方法注解初始化优先于类注解 https://stackoverflow.com/questions/48342656/how-to-access-class-metadata-from-method-decorator
function api(group){
    return (target,name,descriptor)=>{
        let register=metadata(target,target,metadataGroup);
        if(register)register.map(r=>r(group));
    }
}


//. 注解-监听render线程调用事件（与@api绑定使用）
function request(api,group,channel){
    return (target,name,descriptor)=>{
        metadata(target.constructor,target.constructor,metadataGroup,[])
            .push((g=group)=>{
                if(g)bridge.request(g,api||name,descriptor.value,channel)
            });
    }
}


//. 注解- render监听事件回调注册  render.on(callback) <---[webContext.send]
//, api:暴露方法名，afterTrigger: 返回即触发，group：api所属组名，channel：时间名
/*function listen(api,afterTrigger,group,channel){
    return (target,name,descriptor)=>{
        let func = descriptor.value;
        metadata(target.constructor,target.constructor,metadataGroup,[])
            .push((g=group)=>{
                let trigger=bridge.response(g,api||name,channel);
                gatherAPI(g,api||name,trigger);
                if(afterTrigger){
                    descriptor.value = function (...args) {
                        let result=func.apply(this,args);
                        trigger(result);                                         //, 发送返回信息至api
                        return result;
                    };
                }
            });
    }
}*/


//, api: 前端window暴露方法名
//, group: 前端window暴露方法组名
//, channel: api监听消息名
//, fire(triggerReturn): 返回即回调api
//, handler(registerHandler)：自定义注册动作，必须含有register方法 返回注册方法
function listen({fire=false, handler}={},api,group,channel){
    return (target,name,descriptor)=>{
        let func = descriptor.value;
        metadata(target.constructor,target.constructor,metadataGroup,[])
        .push((g=group)=>{
            let trigger=bridge.response(g,api||name,channel,handler);
            if(fire){
                descriptor.value = function (...args) {
                    let result=func.apply(this,args);
                    trigger(result,...args);                                         //, 发送返回信息至api
                    return result;
                };
            }
        });
    }
}



export {
    api,
    request,
    listen
}