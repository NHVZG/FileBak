//% main进程（暴露给网页的调用main进程的api）
import {contextBridge, ipcRenderer,ipcMain,BrowserWindow} from "electron";
import {WebRTCClient} from "@/backend/v4/core/module/rtc/client";
import {WsServer} from "@/backend/v4/core/module/ws/server";

class Bridge{
    constructor(win) {
        this.win=win;
        this.renderApi={};
        this.mainApi={};
    }

    //. render调用main
    request(group,api,callback,channel){
        if(!channel)channel=`${group}_${api}`;
        //, render->main api
        if(!this.renderApi[group])this.renderApi[group]={};
        this.renderApi[group][api]=(...arg)=>ipcRenderer.invoke(channel,...arg);

        //, ->main api
        this.mainApi[channel]=()=>{
            ipcMain.removeHandler(channel);
            ipcMain.handle(channel,(event,...param)=>callback(...param));
        }
    }

    //. main调用render
    response(group,api,channel,registerHandler){
        if(!channel)channel=`${group}_${api}`;
        if(!this.renderApi[group])this.renderApi[group]={};
        let listenWrapper=(listenChannel)=>{
            return callback => {
                ipcRenderer.removeAllListeners(listenChannel);                                                                            //, 移除所有前端监听 避免多次执行监听事件
                ipcRenderer.on(listenChannel, (sender, ...arg) => callback(...arg, sender));
            }
        }

        //, 自定义
        if(registerHandler){
            let {listener,trigger}=registerHandler.generate(channel,listenWrapper,this.renderApi[group][api]);
            if(listener)this.renderApi[group][api]=listener;
            return trigger;
        }
        //, 默认
        //, render<- api
        this.renderApi[group][api] =listenWrapper(channel);
        //, render<-main api
        return this.trigger(channel);
    }

    trigger(channel){
        return (...arg)=>{
            let holder=arg[arg.length-1];
            let args=arg;
            if(holder instanceof WebRTCClient||holder instanceof WsServer){
                args=arg.slice(0,arg.length-1);
            }
            this.win.webContents.send(channel,...args);
        }
    }

    //. render线程初始化
    preload(){
        Object.entries(this.renderApi).map(e=>{
            contextBridge.exposeInMainWorld(e[0],e[1]);
        });
    }

    //. main线程初始化
    init(){
        Object.entries(this.mainApi).map(e=>e[1]());
    }

    //. 设置窗体句柄
    setWin(win){
        this.win=win;
    }

}

let bridge=new Bridge();


export {bridge};