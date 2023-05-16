import {main, render} from "./bridge";
import {dir, listDriver} from "./core/main/files";
import {channel, MESSAGE_RTC_CHANNEL} from "@/backend/v3/decorator/p2p";

let fileController;

class FileController{

    constructor({
                    onFileStructReply=()=>{}}={}) {
        this.onFileStructReply=onFileStructReply;
    }


    @channel("file-struct-request",MESSAGE_RTC_CHANNEL)
    async fileStructRequest(msg,client){
        let {base}=msg.data;
        let struct=await dir(base);
        client.send('channel',{type:'file-struct-reply',data:{struct}});
    }

    @channel('file-struct-reply',MESSAGE_RTC_CHANNEL)
    async fileStructReply(msg,client){
        fileController.onFileStructReply(msg.data.struct);
    }

}

function initMain2Render(initType){
    fileController=new FileController({
       onFileStructReply:main('files','onFileStructReply')
    });
}

function initRender2Main(initType){
    render('files',{
        dir:                              (base)=>dir(base),
        drivers:                        ()=>listDriver()
    })
}

function initFiles(initType){
    initRender2Main(initType);
    initMain2Render(initType);
}

export {initFiles}