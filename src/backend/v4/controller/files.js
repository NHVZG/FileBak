import {channel, channelReply, controller} from "@/backend/v4/decorator/rtc";
import {dir} from "@/backend/v4/core/module/files/files";
import {api, listen, request} from "@/backend/v4/decorator/api";
import {SERVICE,clientCenter} from "@/backend/v4/core/service/webrtcContainor";


@api('files')
@controller(SERVICE.CLIENT_RTC_CHANNEL)
class FileController{

    //. 获取当前客户端文件结构
    @request('dir')
    async localFileStruct({base}){
        return await dir(base);
    }

    //. 请求远程客户端文件结构
    @request("remoteDir")
    async requestRemoteFileStruct(name,{base}){
        clientCenter.get(name).sendChannel({base,type:'file-struct-request'});
    }

    //. 接收远程客户端文件结构”请求“
    @channel('file-struct-request')
    @channelReply
    async remoteFileStruct({base},client){
        let struct=await dir(base);
        return {type:'file-struct-reply',struct};
    }

    //.接收远程客户端文件结构“返回”
    @channel('file-struct-reply')
    @listen({fire:true})
    async onFileStructReply({struct},client){
        return struct;
    }

}


