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



export {
    FBU_CONF
}