import {channel, channelReply, controller} from "@/backend/v4/decorator/rtc";
import {
    bufferPath,
    chunkFile,
    mergeFile,
    dir,
    writeBuffer, serializeFileItem
} from "@/backend/v4/core/module/files/filesv2";
import {api, listen, request} from "@/backend/v4/decorator/api";
import {SERVICE, clientCenter, EVENT} from "@/backend/v4/core/service/webrtcContainor";
import {RtcHandler} from "@/backend/v4/decorator/rtc-handler";
import {
    auditingUploadFiles,
    cleanAuditingFiles,
    listUploadFiles, receive,
    serializeTree, upload
} from "@/backend/v4/core/service/fileSyncv2";

//% 注解编译过程自上而下，controller接收消息，api注册前端事件，必须先@controller,再@api，保证注册@listen的方法包括了@channel的方法，fire才能生效
@controller(SERVICE.CLIENT_RTC_CHANNEL)
@api('files')
class FileController{
    //`===== 预览文件目录

    //. 获取当前客户端文件结构
    @request('dir')
    async localFileStruct({base}){
        return JSON.parse(serializeFileItem(await dir(base)));
    }

    //. 远程客户端文件结构“发送”
    @request("remoteDir")
    async requestRemoteFileStruct(name,{base,requestId}){
        clientCenter.get(name).sendChannel({base,requestId,type:'file-struct-request'});
    }

    //. 接收远程客户端文件结构”请求“
    @channel('file-struct-request')
    @channelReply()
    async remoteFileStruct({base,requestId},client){
        let struct=await dir(base);
        return {type:'file-struct-reply',struct:JSON.parse(serializeFileItem(struct)),requestId};
    }

    //.接收远程客户端文件结构“返回”
    @channel('file-struct-reply')
    @listen({fire:true,handler:new RtcHandler(SERVICE.CLIENT_RTC_CHANNEL,'fileStructReply')})
    onFileStructReply({struct,requestId},client){
        return {struct,requestId};
    }

    //`===== 文件清单


    //.审核传送文件清单”发送“
    @request("syncFileList")
    async syncFileList(name,{configs,requestId}){
        let list=await listUploadFiles(configs);
        clientCenter.get(name).sendChannel({list,requestId,type:'sync-file-list-receive'})
    }

    //. 审核传送文件清单”接收“
    @channel("sync-file-list-receive")
    @channelReply()
    async syncFileListReceive({list,requestId},client){
        let {receiveFileList,forest}=await auditingUploadFiles(list);
        return {type:'auditing-sync-files-receive',list:receiveFileList,forest:forest.map(t=>JSON.parse(serializeTree(t.covers))),requestId};
    }

    //. 审核传送文件清单”返回“
    @channel("auditing-sync-files-receive")
    @listen({fire:true,handler:new RtcHandler(SERVICE.CLIENT_RTC_CHANNEL,'auditingSyncFileReceive')})
    onAuditingSyncFileReceive({list,forest,requestId},client){
        return {list,forest,requestId,uploads:cleanAuditingFiles(list)};
    }


    //`===== 文件传输
    //. 文件发送
    @request("send")
    async fileTransport(name, {fileItem,requestId}){
        let client=clientCenter.get(name);
        let res= await upload(fileItem,chunk=>{
            return new Promise((resolve,reject)=>{
                client.sendChannel({chunk,fileItem,requestId,type:'file-receive'});
                setTimeout(()=>resolve(),10);
            });
        });
    }

    //. 文件数据接收
    @channel("file-receive")
    async fileReceive({chunk,fileItem,requestId},client){
       receive(chunk,fileItem).then(res=>{
           fileItem.size=chunk.fileSize;
           fileItem.offset=chunk.offset;
           client.sendChannel({state:res.state,fileItem,id:chunk.id,type:'file-send-complete',requestId});
        });
    }

    //. 文件已接收
    @channel("file-send-complete")
    @listen({fire:true,handler:new RtcHandler(SERVICE.CLIENT_RTC_CHANNEL,'fileSendComplete')})
    onSendComplete({state,fileItem,id,requestId},client){
        return {state,fileItem,id,requestId};
    }


}


