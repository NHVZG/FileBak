import {__resolvePublic} from "../utils/util";
import fs from "fs";


let certPath=__resolvePublic('certificate/server.cert');
let keyPath=__resolvePublic('certificate/server.key');
let cert=fs.readFileSync(certPath);
let key=fs.readFileSync(keyPath);

let FBU_CONF={
    turn:{
        username:'NHVZG',
        password:'nhvzg',
        port:5000
    },
    ws:{
        server:{
            certPath,
            keyPath,
            cert,
            key,
            tls:true,
            port:6503
        },
        client:{

        }
    },
    rtc:{
        iceServers:[]
    }
}

const INIT_TYPE_RENDER =1;      //初始化渲染进程事件
const INIT_TYPE_MAIN =2;          //初始化主进程事件


export {
    FBU_CONF,
    INIT_TYPE_RENDER,
    INIT_TYPE_MAIN
}