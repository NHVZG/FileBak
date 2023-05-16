<template>
  <el-card shadow="always">
    <h3>webrtc-{{ name }}</h3>
    <el-row :gutter="10">
      <el-button @click="testClientLogin()" :disabled="!login" type="primary">登录</el-button>&nbsp;
    </el-row>
    <el-row :gutter="10">
      <el-col :span="12"><el-input v-model="remote" placeholder="远程ClientID"/></el-col>
      <el-col :span="1"><el-button @click="testClientConnect()" :disabled="!connectChannel" type="primary">连接</el-button></el-col>
    </el-row>
    <el-row>
      <el-col class="left"><el-text>clientID : {{ clientId }}</el-text></el-col>
    </el-row>
    <el-row>
      <el-col class="left"><el-text>状态： {{ channelState }}</el-text></el-col>
    </el-row>
    <el-row :gutter="1">
      <el-col :span="7"><el-button @click="testClientWsDisConnect()" :disabled="connectWs" type="primary" size="small">断开ws</el-button></el-col>
      <el-col :span="8"><el-button @click="testClientRtcDisConnect()" :disabled="!disconnectRtc"  type="primary" size="small">断开rtc</el-button></el-col>
      <el-col :span="7"><el-button @click="testClientChannelDisConnect()" :disabled="!disconnectChannel" type="primary" size="small">断开channel</el-button></el-col>
    </el-row>
    <el-row :gutter="10">
      <el-col :span="18"><el-input v-model="message" placeholder="信息"/></el-col>
      <el-col :span="2"><el-button @click="testClientChannelSend()" :disabled="!disconnectChannel" type="primary">发送</el-button></el-col>
    </el-row>
    <el-row>
      <div class="msg-box">
        <div class="msg" style="display: flex" v-for="item in msgList">
          <div class="msg-label">{{item.remoteClientID}}</div>
          <el-text>:</el-text>
          <div style="word-break: break-word">{{ item.message }}</div>
        </div>
      </div>
    </el-row>
  </el-card>
</template>

<script>
//. websocket状态
const WS_STATE=['CONNECTING','OPEN','CLOSING','CLOSED'];
//. webrtc状态
const RTC_STATE=["CLOSED" , "CONNECTED" , "CONNECTING", "DISCONNECTED" , "FAILED" , "NEW"];
//. webrtc.channel状态
const CHANNEL_STATE=["CLOSED" , "CLOSING" , "CONNECTING" , "OPEN"];

export default {
  name: "RTCChat",
  props:{
    tls:{
      type:Boolean,
      default:true
    },
    host:{
      type:String,
      default:''
    },
    port:{
      type:Number,
      default:6503
    },
    name:{
      type:String,
      default:''
    },
    clientId:{
      type:String,
      default:''
    },
    remoteClientId:{
      type:String,
      default:''
    },
    channelState: {
      type:String,
      default:''
    },
    rtcState: {
      type:String,
      default:''
    },
    wsState: {
      type:String,
      default:''
    },
    msgList:{
      type:Array,
      default:[]
    }
  },
  computed:{
    remote:{
      get(){
        return this.remoteId||this.remoteClientId;
      },
      set(nVal,oVal){
        this.remoteId=nVal;
      }
    },
    login(){
      return WS_STATE[3]===this.wsState;
    },
    connectChannel(){
      return WS_STATE[1]===this.wsState&&CHANNEL_STATE[3]!==this.channelState;
    },
    connectWs(){
      return WS_STATE[1]!==this.wsState;
    },
    disconnectRtc(){
      return RTC_STATE[1]===this.rtcState;
    },
    disconnectChannel(){
      return CHANNEL_STATE[3]===this.channelState;
    }
  },
  data(){
    return {
      remoteId:'',
      message: ''
    };
  },
  methods:{
    testClientLogin(){
      let {tls,host,port}=this;
      window.testWsClient.connect(this.name,{tls,host,port});
      //window.testWebrtc.rtcConnect(name,{remoteClientId});
    },
    testClientConnect(){
      window.testWebrtc.channelConnect(this.name,{remoteClientID:this.remote});
    },
    testClientChannelSend(){
      window.testWebrtc.channelSend(this.name, {type:'message',data:{message:this.message}});
    },
    testClientWsDisConnect(){
      window.testWsClient.terminate(this.name);
    },
    testClientRtcDisConnect(){
      window.testWebrtc.rtcTerminate(this.name);
    },
    testClientChannelDisConnect(){
      window.testWebrtc.channelTerminate(this.name);
    }
  }
}
</script>

<style scoped>
.msg-box{
  text-align: left;
  margin: 10px 0;
  width: 100%;
  border:1px solid #d5d5d5;
  border-radius: 3px;
  padding: 4px;
  height: 400px;
  overflow-y: auto;
}
.msg-label{
  color: gray;
  background-color:#ececec;
  min-width: 10%;
  max-width: 25%
}
.msg{
  margin: 4px;
  display: flex;
}
.msg>div{
  word-break: break-word;
}
.el-row{
  margin: 10px 0;
}
.el-text{
  line-height: 28px;
}
.left{
  text-align: left
}
.msg>.colon{
  line-height: 16px;
  margin-right: 2px
}
</style>