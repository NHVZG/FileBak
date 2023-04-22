import {app} from 'electron';
import path from "path";
import fs from "fs";
import * as util from "../utils/util";

let fbuConfig=null;

const fbuConfigBuilder= {
    web:{
        client:{
            turn: {
                iceServers:null,
                remoteClientID:''
            },
            ws:{
                host:'',
                port:'',
                tls:false
            }
        },
        server:{
            turn:{
                port:6500,
                username:'tun',
                password:'123456'
            },
            ws:{
                tls:false,
                certPath:()=>util.__resolvePublicPath('certificate/server.cert'),
                keyPath:()=>util.__resolvePublicPath('certificate/server.key'),
                cert:()=>fs.readFileSync(fbuConfigBuilder.web.server.ws.certPath()),
                key:()=>fs.readFileSync(fbuConfigBuilder.web.server.ws.keyPath()),
                port:6503,
                block:[]
            }
        }
    }
};

function build(conf,confBuilder){
    for(let k in confBuilder){
        if (!confBuilder.hasOwnProperty(k)) continue;
        if(conf[k]==null){
            if(typeof confBuilder[k]==='function'){
                conf[k]=confBuilder[k]();
                continue;
            }else if(!util.__isObject(confBuilder[k])||confBuilder[k] instanceof Array){
                conf[k]=confBuilder[k];
                continue;
            }else if(confBuilder[k]==null){
                conf[k]=null;
            }
            else conf[k]={};
        }
        if(!util.__isObject(conf[k]))continue;
        build(conf[k],confBuilder[k]);
    }
}

function fbu_config_init(confPath){
    fbuConfig={};
    try{
        let content=util.__readFile(confPath);
        if(!content)content=util.__readFile(app.getAppPath()+'/config.json');
        if(content){
            fbuConfig=JSON.parse(content);
        }
    }catch (err){
        console.error(err);
    }
    build(fbuConfig,fbuConfigBuilder);
}


export {
    fbuConfig,
    fbu_config_init
};