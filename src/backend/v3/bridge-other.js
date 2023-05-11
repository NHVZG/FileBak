//, 版本
import {contextBridge} from "electron";

function initVersion(){
    contextBridge.exposeInMainWorld('versions', {
        node: () =>process.versions.node,
        chrome: () => process.versions.chrome,
        electron: () => process.versions.electron,
    });
}

export {initVersion}