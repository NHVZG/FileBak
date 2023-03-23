import {contextBridge, ipcRenderer,ipcMain,BrowserWindow} from "electron";
import path from 'path';
import * as fs from "fs";
import * as webrtcServer from './webrtc/webrtc-server';
import * as webrtcClient from './webrtc/webrtc-client';
import {fbuConfig} from "./config/config-center";

//? ipcMain操作主进程向渲染进程发送消息或监听渲染进程事件
function ipcHandleInit(win){

    ipcMain.handle('webrtc-connect', (event,data) =>{

    });
    //websocket - server
    ipcMain.handle('ws-server-startup', (event,data) =>{
        return webrtcServer.wsServerBuild({
            wsMessage:(clientID,msg)=>win.webContents.send('wsServerMessage',clientID,msg)//BrowserWindow.getFocusedWindow()
        });
    });
    ipcMain.handle('ws-server-send', (event,msg) =>{
        return webrtcServer.sendChat(msg);
    });
    ipcMain.handle('ws-server-terminate', (event) =>{
        return webrtcServer.wsServerTerminate();
    });
    //websocket - client
    ipcMain.handle('ws-client-connect', (event,data) =>{
        fbuConfig.web.client.port=data.port;
        fbuConfig.web.client.host=data.host;
        return webrtcClient.wsConnect({
            wsMessage:(clientID,msg)=>win.webContents.send('wsClientMessage',clientID,msg),//BrowserWindow.getFocusedWindow()
            wsConnect:(clientID)=>win.webContents.send('wsClientConnect',clientID)
        });
    });
    ipcMain.handle('ws-client-send', (event,msg) =>{
        return webrtcClient.sendToServer({type:'message',msg:msg});
    });
    //turn -  server
    ipcMain.handle('turn-server-startup',()=>{
       return webrtcServer.turnServerBuild();
    });
    ipcMain.handle('turn-server-terminate',()=>{
       return webrtcServer.turnServerTerminate();
    });

}


export {ipcHandleInit};