import {contextBridge, ipcMain, ipcRenderer} from 'electron';

contextBridge.exposeInMainWorld('test', {
    file_access:(arg)=>{
        return ipcRenderer.invoke('file-access-test',arg)
    },
    get_init_type: (callback) => {
        return ipcRenderer.on('init-type-test', callback)
    }
});
