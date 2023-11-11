import fs from "fs";
import path from "path";
import { join } from 'path';
import {initWebRTCServer} from "@/backend/v4/core/service/webrtc";
import {ipcMain, ipcRenderer} from "electron";
import {registerListener} from "@/backend/v4/core/service/webrtcContainor";
import {bridge} from "@/backend/v4/init/bridge";

const cache = {};
function importAll(r) {
    r.keys().forEach((key) => (cache[key] = r(key)));
}

//.自动扫描注解 - （注册api前）
//,在background，render线程执行前，import所有需扫描注解的模块
async function initBefore() {
    //, 🥰自动引入包下的所有模块，即使模块不export
    //,https://www.jianshu.com/p/c894ea00dfec
    //,https://webpack.docschina.org/guides/dependency-management/
        //, -> 解决https://stackoverflow.com/questions/30541388/how-to-find-all-classes-decorated-with-a-certain-decoration
        //, ->解决 https://stackoverflow.com/questions/39624692/get-all-classes-constructors-by-given-decorators

    importAll(require.context('../controller', true, /\.js$/));



    //, 扫描文件自动-失败
    /*var relativePath = path.relative(process.cwd(), '../core/service/');
    let a=fs.readdirSync(relativePath);
    console.log(a);*/
    /*console.log(path.resolve(__static,'../core/service/'));
    console.log(path.resolve(__dirname,'../core/service/'));
    console.log(path.join(__dirname, '../core/service/'));
    console.log(__filename);
    //let a=fs.readdirSync('../core/service/');
    //, import 模块 =import {FileController} from "@/backend/v4/core/service/files";
    return import('../core/service/files.js').then(x=>{
        console.log(x);
    })
    */
}

//.
function initAfter(){
    initRtcInitListener();
    initWebRTCServer();
    //initWebRTCClient('client');
}

//. main线程监听render线程注册trigger方法，用于client,server等事件触发到render
function initRtcInitListener(){
    ipcMain.handle('init_rtc',(ipcEvent,service,name,event,channel)=>{
        registerListener(service,name,event,bridge.trigger(channel));
    });
}
//. render线程发送注册trigger事件，多个客户端实例时需要根据标识区分，需将各个实例的事件监听隔离
function triggerRtcInit(service,name,event,channel){
    ipcRenderer.invoke('init_rtc',service,name,event,channel);
}



export {initBefore,initAfter,triggerRtcInit};