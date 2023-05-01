import {contextBridge, ipcRenderer,ipcMain,BrowserWindow} from "electron";
import {createClient,createServer} from "./main/p2p";
import {FBU_CONF} from "./config/config-center";

function trigger(win,channel,isEvent=false){
    return isEvent?
        (event)=>win.webContents.send(channel,event):
        (...arg)=>win.webContents.send(channel,...arg);
}

//% ipcMain操作主进程向渲染进程发送消息或监听渲染进程事件
function ipcHandleInit(win){
    let server=createServer({
        onWsMessage:trigger(win,'ws-server-msg-listen')//BrowserWindow.getFocusedWindow()
    });
    let clientConf={
        onChannelMessage:trigger(win,'rtc-channel-msg-listen'),
        onChannelOpen:trigger(win,'rtc-channel-open-listen'),
        onChannelClose:trigger(win,'rtc-channel-close-listen'),
        onChannelError:trigger(win,'rtc-channel-error-listen'),
        onWsMessage:trigger(win,'ws-client-msg-listen'),
        onWsConnect:trigger(win,'ws-client-connect-listen'),
        onWsClose:trigger(win,'ws-client-close-listen'),
        onWsError:trigger(win,'ws-client-error-listen'),
        onRTCConnect:trigger(win,'rtc-connect-listen'),
        onRTCClose:trigger(win,'rtc-close-listen'),
        onRTCError:trigger(win,'rtc-error-listen'),
    };
    let client=createClient(clientConf);


    //% turn服务器
    ipcMain.handle('turn-startup', (event,data) =>{
        server.build('turn',{...FBU_CONF.turn});
    });
    ipcMain.handle('turn-terminate', (event,data) =>{
        server.turnServerTerminate();
    });

    //% ws服务端
    ipcMain.handle('ws-server-startup', (event,data) =>{
        server.build('ws',{...FBU_CONF.ws.server});
    });
    ipcMain.handle('ws-server-terminate', (event,data) =>{
        server.wsServerTerminate();
    });
    ipcMain.handle('ws-server-msg-send', (event, {message}) =>{
        server.send('message',server.data().message(message,'server'));//广播
    });

    //% ws客户端
    ipcMain.handle('ws-client-connect', (event,conf) =>{
        client.connect(client.WS,{ws:conf});
    });
    ipcMain.handle('ws-client-msg-send', (event, {message},clientName) =>{
        client.send('ws-message', {message});
    });

    //% webrtc
    ipcMain.handle('rtc-connect', (event,data) =>{
        client.connect(client.RTC,{
            rtc: {
                remoteClientID:data.remoteClientID,
                iceServers:FBU_CONF.rtc.iceServers
            }
        });
    });
    ipcMain.handle('rtc-channel-connect', (event,data,clientName) =>{
        client.connect(client.CHANNEL,{
            channel: {
                remoteClientID:data.remoteClientID,
                iceServers:FBU_CONF.rtc.iceServers
            }
        });
    });
    ipcMain.handle('rtc-channel-send', (event,data) =>{
        client.send('channel',data);
    });

    //% 测试

    let clientTestConf=(name)=>({
        onChannelMessage:(...arg)=>win.webContents.send('rtc-test-channel-msg-listen',name,...arg),
        onChannelOpen:(...arg)=>win.webContents.send('rtc-test-channel-open-listen',name,...arg),
        onChannelClose:(...arg)=>win.webContents.send('rtc-test-channel-close-listen',name,...arg),
        onChannelError:(...arg)=>win.webContents.send('rtc-test-channel-error-listen',name,...arg),
        onWsMessage:(...arg)=>win.webContents.send('ws-test-client-msg-listen',name,...arg),
        onWsConnect:(...arg)=>win.webContents.send('ws-test-client-connect-listen',name,...arg),
        onWsClose:(...arg)=>win.webContents.send('ws-test-client-close-listen',name,...arg),
        onWsError:(...arg)=>win.webContents.send('ws-test-client-error-listen',name,...arg),
        onRTCConnect:(...arg)=>win.webContents.send('rtc-test-connect-listen',name,...arg),
        onRTCClose:(...arg)=>win.webContents.send('rtc-test-close-listen',name,...arg),
        onRTCError:(...arg)=>win.webContents.send('rtc-test-error-listen',name,...arg),
    });
    let client1,client2;

    ipcMain.handle('rtc-client-test-login',(conf,name)=>{
        if(name==='client-1') {
            client1 = createClient(clientTestConf(name));
            client1.connect(client1.WS,{ws:conf});
        }else{
            client2 = createClient(clientTestConf(name));
            client2.connect(client2.WS,{ws:conf});
        }
    });
    ipcMain.handle('rtc-client-test-channel-connect',(data,name)=>{
        (name==='client-1'?client1:client2).connect(client.CHANNEL,{
            channel: {
                remoteClientID:data.remoteClientID,
                iceServers:FBU_CONF.rtc.iceServers
            }
        });
    });
    ipcMain.handle('rtc-client-test-channel-send',(data,name)=>{
        (name==='client-1'?client1:client2).send('channel',data);
    });

}

export {ipcHandleInit};