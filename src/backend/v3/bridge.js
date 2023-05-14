import {contextBridge, ipcMain, ipcRenderer} from "electron";
import {FBU_CONF, INIT_TYPE_MAIN, INIT_TYPE_RENDER} from "./config/config-center";
import {
    initTest,
    initMain2Render as initTestMain2Render,
    initRender2Main as initTestRender2Main
} from "./bridge-test";
import {initP2P} from './bridge-p2p';
import {initVersion} from './bridge-other';
import {initFiles} from './bridge-file';

/**
* 暴露方法
* % 双向 (render) ipcRenderer.invoke  --> ipcMain.handle (main)
* % 单向 (render) ipcRenderer.on        <--  BrowserWindow.webContents.send (main)
* % 单向 (render) ipcRenderer.send     --> ipcMain.on (main)
*/

let exposeMap={};       //. 暴露方法
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
        let exposes = {
            [name]: callback => {
                ipcRenderer.removeAllListeners(channel);                                                                            // 移除所有前端监听 避免多次执行监听事件
                ipcRenderer.on(channel, (sender,...arg)=>callback(...arg));
            }};
        exposeMap[group] = exposeMap[group] ? {...exposeMap[group], ...exposes} : exposes;
    }else if(initTYPE===INIT_TYPE_MAIN){
        return (...arg)=>{
            win.webContents.send(channel,...p,...arg);
        }
    }
    return null;
}

function init(){
    initTest(initTYPE);
    initP2P(initTYPE);
    initFiles(initTYPE);
}

//. render进程先于main线程初始化 因此需要分离出两个方法
//. 初始化ipcRenderer
function exposeAPI(){
    initTYPE=INIT_TYPE_RENDER;
    init();

    initVersion();
    Object.entries(exposeMap).map(e=>contextBridge.exposeInMainWorld(e[0],e[1]));
}

//. 初始化ipcMain
function initIpcMain(){
    initTYPE=INIT_TYPE_MAIN;
    init();
}

//. 设置win窗体句柄，由于初始化主线程在窗体创造前，vue-mounted才可以调用到，最后才可设置win
//. render线程事件注册-main线程注册-win窗体创建-设置窗体
function setWin(appWin){
    win=appWin;
}


export {
    render,                 //' 注册渲染进程事件
    main,                   //' 注册主线程事件
    exposeAPI,          //' 初始化渲染进程事件
    initIpcMain,        //' 初始化主进程事件
    setWin                 //' 设置窗体
};