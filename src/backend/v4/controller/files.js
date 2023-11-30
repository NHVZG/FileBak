import {channel, channelReply, controller} from "@/backend/v4/decorator/rtc";
import {dir} from "@/backend/v4/core/module/files/files";
import {api, listen, request} from "@/backend/v4/decorator/api";
import {SERVICE, clientCenter, EVENT} from "@/backend/v4/core/service/webrtcContainor";
import {RtcHandler} from "@/backend/v4/decorator/rtc-handler";
import {app} from "electron";
import {listFileTransport} from "@/backend/v4/core/service/fileSync";

//% 注解编译过程自上而下，controller接收消息，api注册前端事件，必须先@controller,再@api，保证注册@listen的方法包括了@channel的方法，fire才能生效
@controller(SERVICE.CLIENT_RTC_CHANNEL)
@api('files')
class FileController{

    //. 获取当前客户端文件结构
    @request('dir')
    async localFileStruct({base}){
        return await dir(base);
    }

    //. 请求远程客户端文件结构
    @request("remoteDir")
    async requestRemoteFileStruct(name,{base,requestId}){
        clientCenter.get(name).sendChannel({base,requestId,type:'file-struct-request'});
    }

    //. 接收远程客户端文件结构”请求“
    @channel('file-struct-request')
    @channelReply()
    async remoteFileStruct({base,requestId},client){
        let struct=await dir(base);
        return {type:'file-struct-reply',struct,requestId};
    }

    //.接收远程客户端文件结构“返回”
    @channel('file-struct-reply')
    @listen({fire:true,handler:new RtcHandler(SERVICE.CLIENT_RTC_CHANNEL,'fileStructReply')})
    onFileStructReply({struct,requestId},client){
        return {struct,requestId};
    }

    //.初始化
    @request("syncFileList")
    async syncFileList(name,{configs,requestId}){
        let list=await listFileTransport(configs);
        clientCenter.get(name).sendChannel({list,requestId,type:'sync-file-list'})
    }

    @channel("sync-file-list")
    @channelReply()
    async syncFileListReceive({list,requestId},client){
        console.log(list);
    }


}

