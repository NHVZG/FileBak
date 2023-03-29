
import {fbuConfig} from "../config/config-center";
import {WebSocket }   from 'ws';
import {__log,__result} from "../utils/util";
import {RTCPeerConnection,RTCIceCandidate,RTCSessionDescription} from "wrtc";

let onWsMessageCallBack=()=>{};         //. ws信息回调
let onWsConnectCallBack=()=>{};         //. ws连接建立回调
let wsConnection;                                         //. 连接
let clientID;                                               //. 客户端id
let rtcConnection;                                    //. webrtc连接
let rtcChannel;                                         //. webrtc通道

//. webscokect连接远程客户端
function wsConnect({wsMessage,wsConnect}){
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;            //允许自签证书
    let {tls,host,port}=fbuConfig.web.client.ws;
    wsConnection=new WebSocket(`${tls?'wss':'ws'}://${host}:${port}`)

    wsConnection.on('error', onWsError);
    wsConnection.on('open',onWsOpen);
    wsConnection.on('ping', onWsPing);
    wsConnection.on('close',onWsClose);
    wsConnection.on('message',onWsMessage);

    onWsMessageCallBack=wsMessage||onWsMessageCallBack;
    onWsConnectCallBack=wsConnect||onWsConnectCallBack;
    return true;
}

//. 心跳
function heartbeat() {
    clearTimeout(wsConnection.pingTimeout);
    wsConnection.pingTimeout = setTimeout(() => {
        wsConnection.terminate();
    }, 30000 + 1000);
}

//. websocket开启
function onWsOpen(){
    console.log('open');
    wsConnection=this;
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
    wsConnection=this;
    heartbeat();
}

//. 接收信息
function onWsMessage(data,isBinary){
    let json=JSON.parse(data.toString())
    switch(json.type){
        case 'signed':clientID=json.clientID;onWsConnectCallBack(json.clientID);break;                                          //连接成功
        case 'message':if(onWsMessageCallBack)onWsMessageCallBack(json.clientID,json.msg);break                 //接受信息

        case 'sdp-send':                                                                                                                                                  //webrtc-ice信息交换发送
            remoteClientID=json.data.from;
            onSdpReceive(json.data.sdp,json.data.from);break;
        case 'sdp-receive':                                                                                                                                              //webrtc-ice信息交换接收
            remoteClientID=json.data.from;
            onSdpAnswer(json.data.sdp);break;
        case 'ice':
            onIce(json.data.candidate);break;
    }
}
let remoteClientID='';
function setRemoteClientID(r){
    remoteClientID=r;
}


//. 向服务器发送
function sendToServer(msg){
    if(!wsConnection)throw 'connection not found';
    wsConnection.send(JSON.stringify(msg));
}

async function onSdpReceive(sdp,remoteClientID){
    if(!rtcConnection) {
        rtcConnection = createWebRtcConnection();
    }
    let desc = new RTCSessionDescription(sdp);
    
    if (rtcConnection.signalingState !== "stable") {
        __log("  - But the signaling state isn't stable, so triggering rollback");
        // Set the local and remove descriptions for rollback; don't proceed
        // until both return.
        await Promise.all([
            rtcConnection.setLocalDescription({type: "rollback"}),
            rtcConnection.setRemoteDescription(desc)
        ]);
        return;
    } else {
        __log ("  - Setting remote description");
        await rtcConnection.setRemoteDescription(desc);
    }

    await rtcConnection.setLocalDescription(await rtcConnection.createAnswer());

    sendToServer({
        from:clientID,
        to:remoteClientID,
        type: "sdp-receive",
        sdp:rtcConnection.localDescription
    });

}

async function onSdpAnswer(sdp){
    __log("sdp answer");

    // Configure the remote description, which is the SDP payload
    // in our "video-answer" message.

    let desc = new RTCSessionDescription(sdp);
    await rtcConnection.setRemoteDescription(desc);
}

async function onIce(candidate) {
    let rtcIceCandidate = new RTCIceCandidate(candidate);
    __log("*** Adding received ICE candidate: " + JSON.stringify(candidate));
    try {
        await rtcConnection.addIceCandidate(rtcIceCandidate)
    } catch(err) {
        reportError(err);
    }
}

function start(){
    rtcConnection=createWebRtcConnection();

    rtcChannel = rtcConnection.createDataChannel('sendDataChannel');
    rtcChannel.binaryType = 'arraybuffer';
    rtcChannel.onopen=()=>{
        rtcChannel.send('1233');
        __log('rtc channel opened');
    }
    rtcChannel.onclose=()=>closeRTCConnection();
    rtcChannel.onmessage=(event)=>__log(event.data);
    //rtcChannel.bufferedAmountLowThreshold
    //rtcChannel.onbufferedamountlow=

}

function sendrtc(){
    rtcChannel.send('4444');
}

function createWebRtcConnection(){
    let a=fbuConfig.web.client.turn.iceServers;
    let connection=fbuConfig.web.client.turn.iceServers?
        new RTCPeerConnection({iceServers:fbuConfig.web.client.turn.iceServers}):
        new RTCPeerConnection();

    //` ice-candidate交换初始化
    connection.onicecandidate = onIceCandidate;

    //` ice-connection连接变动事件（ice-connection在检测网络变动，如stun/turn切换之类）
    connection.oniceconnectionstatechange = onIceConnectionStateChange;

    //` ice-candidate 采集状态
    connection.onicegatheringstatechange = ()=>__log('ice-gathering-state: '+connection.iceGatheringState);

    //` 连接状态发生变化（有新的通道加入RTCRtpReceiver时）
    connection.onconnectionstatechange=()=>__log('connection-state: '+connection.connectionState);

    //` 信令服务器协商状态变动事件
    connection.onsignalingstatechange = onSignalingStateChange;

    //` 开始协商事件
    connection.onnegotiationneeded = onNegotiationNeeded;

    //` 数据传输事件(rtc)
    connection.ontrack = onTrack;

    //` 自定义数据通道事件
    connection.ondatachannel=onDataChannel;

    return connection;
}

function onDataChannel(event){
    rtcChannel=event.channel;
    const  channel=event.channel;

    channel.binaryType = 'arraybuffer';
    channel.addEventListener('message', event => {
        console.log(event.data);
    });
    channel.addEventListener('close', () => {

    });
}



//. ice-candidate交换初始化事件
function onIceCandidate(event){
    if(!event.candidate)return;
    __log('Outgoing ice candidate:'+event.candidate.candidate);
    sendToServer({
        type:'ice',
        to:remoteClientID,
        candidate:event.candidate,
        clientID:clientID
    });
}

//.  ice连接状态更改
function  onIceConnectionStateChange(){
    __log("ice-connection: "+rtcConnection.connectionState);
    switch (rtcConnection.iceConnectionState){
        case "closed":
        case "failed":
        case "disconnected":closeRTCConnection();break;
    }
}

//. 信令服务器状态更改
function onSignalingStateChange(){
    __log("ice-connection: "+rtcConnection.signalingState);
    switch(rtcConnection.signalingState) {
        case "closed":
            closeRTCConnection();
            break;
    }
}

//. 开始协商事件
async function onNegotiationNeeded(){
    __log('negotiation started');
    try {
        let offer = await rtcConnection.createOffer();
        if (rtcConnection.signalingState !== "stable") {
            __log("     -- The connection isn't stable yet; postponing...")
            return __result(false)("connection isn't stable");
        }
        await rtcConnection.setLocalDescription(offer);
        sendToServer({
            type:'sdp-send',
            from:clientID,
            to:remoteClientID,
            sdp:rtcConnection.localDescription
        });
    }catch (err){
        __log(err,true);
        return __result(false)(err);
    }
}

function onTrack(){
    __log('tracking');
}

//. 关闭webrtc连接
function closeRTCConnection(){
    if (rtcConnection) {
        __log("--> Closing the peer connection:");

        // Disconnect all our event listeners; we don't want stray events to interfere with the hangup while it's ongoing.
        rtcConnection.ontrack = null;
        rtcConnection.onicecandidate = null;
        rtcConnection.oniceconnectionstatechange = null;
        rtcConnection.onsignalingstatechange = null;
        rtcConnection.onicegatheringstatechange = null;
        rtcConnection.onnotificationneeded = null;

        // Stop all transceivers on the connection
        //` 一个webrtc连接可以对应多个通道，单独处理
        rtcConnection.getTransceivers().forEach(transceiver => transceiver.stop());

        // Close the peer connection
        rtcConnection.close();
        rtcConnection = null;
    }
}

export {sendToServer,wsConnect,start,sendrtc,setRemoteClientID}