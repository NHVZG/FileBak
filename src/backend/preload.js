import { contextBridge ,ipcRenderer } from 'electron';

//? ipcRenderer操作渲染进程向主进程发送消息或监听主进程事件

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,          //. electron内部集成node，因此外部版本对程序无效果
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
});

/**
 * 暴露方法
 * % 双向 (render) ipcRenderer.invoke  --> ipcMain.handle (main)
 * % 单向 (render) ipcRenderer.on        <--  BrowserWindow.webContents.send (main)
 * % 单向 (render) ipcRenderer.send     --> ipcMain.on (main)
 */
contextBridge.exposeInMainWorld('webrtc', {
    webrtc_connect:(arg)=>{
        return ipcRenderer.invoke('webrtc-connect',arg)
    }
});


contextBridge.exposeInMainWorld('wsServer', {
    startup:(arg)=>ipcRenderer.invoke('ws-server-startup',arg),
    send:(...arg)=>ipcRenderer.invoke('ws-server-send',...arg),
    terminate:(...arg)=>ipcRenderer.invoke('ws-server-terminate',...arg),
    onMsg:(callback)=>ipcRenderer.on('wsMessage',callback),
});

contextBridge.exposeInMainWorld('wsClient', {
    connect:(...arg)=>ipcRenderer.invoke('ws-client-connect',...arg),
    send:(...arg)=>ipcRenderer.invoke('ws-client-send',...arg),
    onMsg:(callback)=>ipcRenderer.on('wsMessage',callback)
});