import {app, contextBridge, ipcMain, ipcRenderer} from 'electron';
import path from "path";
import fs from "fs";
import {fileAccess} from  './fileAccess/file-access';
import {MyTestableClass} from "../annotation/annotation-test";

//初始化
function testIpcHandleInit(win){
    //文件访问测试
    fileAccess();
    //测试注解
    let testable=new MyTestableClass();
    console.log(testable.isTestable);
    testable.test();


    //初始化
    setTimeout(()=> {
        win.webContents.send('init-type-test', 12323);
    },5000);
    //监听事件
    ipcMain.handle('file-access-test', (event,data) =>{
        console.log(data);
        console.log('222');
        console.log(app.getAppPath());
        let filePath=path.resolve(__static,'certificate/server.key');
        let c=fs.readFileSync(filePath);
        return app.getAppPath();
        //return '456'+data+":"+path.resolve(__dirname,'dir')+__static+''+__statics;
        //return __dirname+''+__static;//path.resolve(__dirname,'../../public/certificate/server.key');
    });

}


export {testIpcHandleInit};