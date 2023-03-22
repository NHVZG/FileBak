
/*
//连接，交换ice配置连接
const loginConf={
    connection:null,
    url:''
};
function connect({loginUrl}){
    loginConf.url=loginUrl;
    let {connection}=loginConf;
    if(connection&&loginUrl!==loginConf.url){
        connection.close(1000,'connect to new server');
    }
    connection=new WebSocket(loginUrl);

    connection.onopen=function(event){

    }

    connection.onerror=function(event){

    }

    connection.onmessage=function(event){
        let msg=JSON.parse(event.data);
        switch (msg){

        }


    }

}*/

import {fbuConfig} from "../config/config-center";
import {WebSocket }   from 'ws';

let onWsMessageCallBack=()=>{};         //. ws信息回调
let onWsConnectCallBack=()=>{};         //. ws连接建立回调
let connection;                                         //. 连接
let clientID;                                               //. 客户端id

//. webscokect连接远程客户端
function wsConnect({wsMessage,wsConnect}){
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;            //允许自签证书
    let {tls,host,port}=fbuConfig.web.client;
    connection=new WebSocket(`${tls?'wss':'ws'}://${host}:${port}`)

    connection.on('error', onWsError);
    connection.on('open',onWsOpen);
    connection.on('ping', onWsPing);
    connection.on('close',onWsClose);
    connection.on('message',onWsMessage);

    onWsMessageCallBack=wsMessage||onWsMessageCallBack;
    onWsConnectCallBack=wsConnect||onWsConnectCallBack;
    return true;
}

//. 心跳
function heartbeat() {
    clearTimeout(connection.pingTimeout);
    connection.pingTimeout = setTimeout(() => {
        connection.terminate();
    }, 30000 + 1000);
}

//. websocket开启
function onWsOpen(){
    console.log('open');
    connection=this;
    heartbeat();
}

//. websocket关闭
function onWsClose(){
    console.log('close');
    clearTimeout(this.pingTimeout);
}

//. websocket错误
function onWsError(){
    console.log('error');
    clearTimeout(this.pingTimeout);
}

//.心跳ping帧处理
function onWsPing(){
    console.log('ping');
    connection=this;
    heartbeat();
}

//. 接收信息
function onWsMessage(data,isBinary){
    let json=JSON.parse(data.toString());
    switch(json.type){
        case 'signed':clientID=json.clientID;onWsConnectCallBack(json.clientID);break;
        case 'message':if(onWsMessageCallBack)onWsMessageCallBack(json.clientID,json.msg);break;
    }
}

//. 向服务器发送
function sendToServer(msg){
    if(!connection)throw 'connection not found';
    connection.send(JSON.stringify(msg));
}

export {sendToServer,wsConnect}