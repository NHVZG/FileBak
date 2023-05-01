import { contextBridge ,ipcRenderer } from 'electron';

function listen(key){
    return callback=>ipcRenderer.on(key,callback);
}

function invoke(key){
    return (...arg)=>ipcRenderer.invoke(key,...arg)
}


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
contextBridge.exposeInMainWorld('turn', {
    startup:invoke('turn-startup'),
    terminate:invoke('turn-terminate')
});


contextBridge.exposeInMainWorld('wsServer', {
    terminate:invoke('ws-server-terminate'),
    send:invoke('ws-server-msg-send'),
    startup:invoke('ws-server-startup'),

    onMessage:listen('ws-server-msg-listen'),
});


contextBridge.exposeInMainWorld('wsClient', {
    connect:invoke('ws-client-connect'),
    send:invoke('ws-client-msg-send'),

    onError:listen('ws-client-error-listen'),
    onClose:listen('ws-client-close-listen'),
    onMessage:listen('ws-client-msg-listen'),
    onConnect:listen('ws-client-connect-listen'),
});

contextBridge.exposeInMainWorld('rtc', {
    channelConnect:invoke('rtc-channel-connect'),
    channelSend:invoke('rtc-channel-send'),
    rtcConnect:invoke('rtc-connect'),

    onRTCError:listen('rtc-error-listen'),
    onRTCClose:listen('rtc-close-listen'),
    onRTCConnect:listen('rtc-connect-listen'),

    onChannelMsg:listen('rtc-channel-msg-listen'),
    onChannelClose:listen('rtc-channel-close-listen'),
    onChannelOpen:listen('rtc-channel-open-listen'),
    onChannelError:listen('rtc-channel-error-listen'),
});


contextBridge.exposeInMainWorld('testWebrtc',{
    rtcLogin: invoke('rtc-client-test-login'),
    rtcChannelConnect:invoke('rtc-client-test-channel-connect'),
    rtcChannelSend:invoke('rtc-client-test-channel-send'),
    
    onChannelMessage :listen('rtc-test-channel-msg-listen'),
    onChannelOpen :listen('rtc-test-channel-open-listen'),
    onChannelClose :listen('rtc-test-channel-close-listen'),
    onChannelError :listen('rtc-test-channel-error-listen'),

    onWsMessage :listen('ws-test-client-msg-listen'),
    onWsConnect :listen('ws-test-client-connect-listen'),
    onWsClose :listen('ws-test-client-close-listen'),
    onWsError :listen('ws-test-client-error-listen'),
    onRtcConnect :listen('rtc-test-connect-listen'),
    onRtcClose :listen('rtc-test-close-listen'),
    onRtcError :listen('rtc-test-error-listen'),
});
