import {contextBridge, ipcMain, ipcRenderer} from "electron";
import {createClient, createServer} from "./main/p2p";
import {FBU_CONF, INIT_TYPE_MAIN, INIT_TYPE_RENDER} from "./config/config-center";
import {initMain2Render as initTestMain2Render, initRender2Main as initTestRender2Main} from "./bridge-test";
import {dir,listDriver} from "./main/files";

/**
* 暴露方法
* % 双向 (render) ipcRenderer.invoke  --> ipcMain.handle (main)
* % 单向 (render) ipcRenderer.on        <--  BrowserWindow.webContents.send (main)
* % 单向 (render) ipcRenderer.send     --> ipcMain.on (main)
*/

let exposeMap={};       //. 暴露方法
let handlerList=[];       //. main注册方法
let win;                          //. 窗体

let initTYPE;

//% render线程 通知main 线程初始化
function render(group,handleMap){
    if(initTYPE===INIT_TYPE_RENDER){
        let exposes=Object.entries(handleMap).reduce((map,e)=> {
            let channel = e[1].channel || (group + '_' + e[0]);                                                                         //object则取channel 否则为function
            return {...map,[e[0]]:(...arg)=>ipcRenderer.invoke(channel,...arg)};
        },{});
        exposeMap[group]=exposeMap[group]?{...exposeMap[group],...exposes}:exposes;
    }else if(initTYPE===INIT_TYPE_MAIN){
        Object.entries(handleMap).map(e=>{
            let channel=e[1].channel||(group + '_' + e[0]);                                                                         //object则取channel 否则为function
            let func=e[1].handle||e[1];
            ipcMain.handle(channel,(event,...data)=>func(...data));
        });
    }
}

//% main线程  通知render 线程初始化
function main(group,name,channel,...p){
    channel=channel || (group + '_' + name);
    if(initTYPE===INIT_TYPE_RENDER){
        let exposes = {[name]: callback => ipcRenderer.on(channel, (sender,...arg)=>callback(...arg))};
        exposeMap[group] = exposeMap[group] ? {...exposeMap[group], ...exposes} : exposes;
    }else if(initTYPE===INIT_TYPE_MAIN){
        return (...arg)=>{
            win.webContents.send(channel,...p,...arg);
        }
    }
    return null;
}

//, main进程调用render
function initMain2Render(){
    let server={
        onWsMessage:main('wsServer','onMessage'),
        onWsMessageSend:main('wsServer','onMessageSend')
    };
    let client={
        onWsConnect:main('wsClient','onWsConnect'),
        onWsMessage:main('wsClient','onWsMessage'),
        onWsMessageSend:main('wsClient','onWsMessageSend'),
        onWsError:main('wsClient','onWsError'),
        onWsClose:main('wsClient','onWsClose'),
        onRtcConnect:main('webrtc','onRtcConnect'),
        onRtcError:main('webrtc','onRtcError'),
        onRtcClose:main('webrtc','onRtcClose'),
        onChannelOpen:main('webrtc','onChannelOpen'),
        onChannelMessage:main('webrtc','onChannelMessage'),
        onChannelError:main('webrtc','onChannelError'),
        onChannelClose:main('webrtc','onChannelClose')
    };
    return {server,client};
}

//, render进程调用main
function initRender2Main({server,client}={}){
    //turn服务器
    render('turn',{
        startup:                          data=>server.build(server.TYPE_TURN,{...FBU_CONF.turn}),
        terminate:                      data=>server.terminate(server.TYPE_TURN)
    });
    //websocket服务端
    render('wsServer',{
        startup:                          data=>server.build('ws',{...FBU_CONF.ws.server}),
        terminate:                      data=>server.terminate(server.TYPE_WS),
        send:                              ({message})=>server.send('ws-message-data',{message})
    });
    //websocket客户端
    render('wsClient',{
        connect:                         conf=>client.connect(client.TYPE_WS,{ws:conf}),
        send:                              ({message})=>client.send('ws-message-data', {message}),
        terminate:                      data=>client.wsClose()
    });
    //webrtc p2p
    render('webrtc',{
        rtcTerminate:             data=>client.rtcClose(),
        rtcConnect:                data=>client.connect(client.TYPE_RTC,{
                                                rtcRemoteClientID:data.remoteClientID,
                                                rtc: {
                                                    iceServers:FBU_CONF.rtc.iceServers
                                                }
                                            }),
        channelConnect:        data=>client.connect(client.TYPE_CHANNEL,{
                                                rtcRemoteClientID:data.remoteClientID,
                                                channel: {
                                                    iceServers:FBU_CONF.rtc.iceServers
                                                }
                                            }),
        channelSend:             data=>client.send('channel',data),
        channelTerminate:     data=>client.channelClose()
    });
    //files
    render('files',{
        dir:                              (base)=>dir(base),
        //drivers:                     (callback)=>listDriver(callback)
        drivers:                        ()=>listDriver()
    })
}


//, 版本
function initVersion(){
    contextBridge.exposeInMainWorld('versions', {
        node: () =>process.versions.node,
        chrome: () => process.versions.chrome,
        electron: () => process.versions.electron,
    });
}



//. 初始化ipcRenderer
function exposeAPI(){
    initTYPE=INIT_TYPE_RENDER;

    initMain2Render();
    initRender2Main();
    initVersion();

    initTestRender2Main({render,main},initTYPE);
    initTestMain2Render({render,main},initTYPE);

    Object.entries(exposeMap).map(e=>contextBridge.exposeInMainWorld(e[0],e[1]));
}

//. 初始化ipcMain
function initIpcMain(){
    initTYPE=INIT_TYPE_MAIN;

    let conf=initMain2Render();
    initRender2Main({
        server:createServer(conf.server),
        client:createClient(conf.client)
    });

    initTestRender2Main({render,main},initTYPE);
    initTestMain2Render({render,main},initTYPE);
}

//. 设置win窗体句柄
function setWin(appWin){
    win=appWin;
}


export {exposeAPI,initIpcMain,setWin};