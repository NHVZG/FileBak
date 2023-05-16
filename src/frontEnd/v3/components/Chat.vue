<template>
  <div>


    <el-row :gutter="10">
      <el-col>
        <el-card shadow="always">
          <el-row :gutter="10">
            <el-col :span="7" class="left"><el-text>websocket服务器:</el-text></el-col>
            <el-col :span="1.5"><el-button @click="wsServerStartup" type="primary" :disabled="ws.server.state!=='CLOSED'">启动</el-button></el-col>
            <el-col :span="1.5"><el-button @click="wsServerTerminate" type="primary" :disabled="ws.server.state!=='RUNNING'">停止</el-button></el-col>
            <el-col :span="1.5"><el-text>状态：{{ws.server.state}}</el-text></el-col>
          </el-row>
          <el-row :gutter="10">
            <el-col :span="7" style="text-align: left"><el-text>turn服务器:</el-text></el-col>
            <el-col :span="1.5"><el-button @click="turnStartup" type="primary" :disabled="turn.state!=='CLOSED'">启动</el-button></el-col>
            <el-col :span="1.5"><el-button @click="turnTerminate" type="primary" :disabled="turn.state!=='RUNNING'">停止</el-button></el-col>
            <el-col :span="1.5"><el-text>状态：{{turn.state}}</el-text></el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="10">
      <el-col :span="12">
        <el-card shadow="always">
              <h3>websocket客户端</h3>
              <el-row :gutter="6">
                <el-col :span="8.5"><el-switch v-model="ws.client.tls" active-text="https" /></el-col>
                <el-col :span="7.5"><el-button @click="wsClientConnect" type="primary" :disabled="ws.client.state!=='CLOSED'">连接</el-button></el-col>
                <el-col :span="8.5"><el-button @click="wsClientDisConnect" type="primary" :disabled="ws.client.state!=='OPEN'">断开</el-button></el-col>
              </el-row>
              <el-row :gutter="1">
                <el-col :span="10"><el-input v-model="ws.client.host" placeholder="地址"/></el-col>
                <el-col :span="0.5"><el-text>:</el-text></el-col>
                <el-col :span="8"><el-input v-model="ws.client.port" placeholder="端口"/></el-col>
              </el-row>
            <el-row>
              <el-col :span="24" class="left">状态：{{ws.client.state}}</el-col>
            </el-row>
              <el-row>
                  <el-col :span="24" class="left">ClientID：{{ws.client.clientID}}</el-col>
              </el-row>
              <el-row :gutter="10">
                <el-col :span="18"><el-input v-model="ws.client.message" placeholder="信息"/></el-col>
                <el-col :span="2"><el-button @click="wsClientSend" :disabled="ws.client.state!=='OPEN'" type="primary">发送</el-button></el-col>
              </el-row>
              <el-row>
                  <div class="msg-box">
                      <div v-for="item in ws.client.msgList" class="msg">
                        <div class="msg-label">[{{ item.time }}]<span style="color: red">{{ item.from }}</span></div>
                        <div class="colon" >：</div>
                        <div>{{ item.data.message }}</div>
                      </div>
                  </div>
              </el-row>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="always">
            <h3>websocket服务端</h3>
           <el-row style="margin: 58px 0" :gutter="1">&nbsp;</el-row>
            <el-row :gutter="10">
              <el-col :span="18"><el-input v-model="ws.server.message" placeholder="信息"/></el-col>
              <el-col :span="2"><el-button @click="wsServerSend" :disabled="ws.server.state!=='RUNNING'" type="primary">发送</el-button></el-col>
            </el-row>
            <el-row>
              <div class="msg-box">
                <div v-for="item in ws.server.msgList" class="msg">
                  <div class="msg-label">[{{ item.time }}]<span style="color: red">{{ item.from }}</span></div>
                  <div class="colon" >：</div>
                  <div>{{ item.data.message }}</div>
                </div>
              </div>
            </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="10">
      <el-col :span="12">
        <RTCChat
            :host="ws.client.host"
            :port="ws.client.port"
            :tls="ws.client.tls"
            :channel-state="rtc.client1.channelState"
            :rtc-state="rtc.client1.rtcState"
            :ws-state="rtc.client1.wsState"
            :name="rtc.client1.name"
            :client-id="rtc.client1.clientID"
            :remote-client-id.sync="rtc.client1.remoteClientID"
            :msg-list="rtc.client1.msgList"
        />
<!--        <el-card shadow="always">
          <h3>webrtc-client1</h3>
          <el-row :gutter="10">
              <el-button @click="testClientLogin(rtc.client1.name)" :disabled="rtc.client1.wsState!=='CLOSED'" type="primary">登录</el-button>&nbsp;
          </el-row>
          <el-row :gutter="10">
              <el-col :span="12"><el-input v-model="rtc.client1.remoteClientID" placeholder="远程ClientID"/></el-col>
              <el-col :span="1"><el-button @click="testClientConnect(rtc.client1.name,rtc.client1.remoteClientID)" :disabled="rtc.client1.wsState!=='OPEN'||rtc.client1.rtcState!=='CLOSED'" type="primary">连接</el-button></el-col>
          </el-row>
          <el-row>
            <el-col class="left"><el-text>clientID : {{ rtc.client1.clientID }}</el-text></el-col>
          </el-row>
          <el-row>
            <el-col class="left"><el-text>状态： {{ rtc.client1.state }}</el-text></el-col>
          </el-row>
          <el-row :gutter="1">
            <el-col :span="7"><el-button @click="testClientWsDisConnect(rtc.client1.name)" :disabled="rtc.client1.wsState!=='OPEN'" type="primary" size="small">断开ws</el-button></el-col>
            <el-col :span="8"><el-button @click="testClientRtcDisConnect(rtc.client1.name)" :disabled="rtc.client1.rtcState!=='CONNECTED'" type="primary" size="small">断开rtc</el-button></el-col>
            <el-col :span="7"><el-button @click="testClientChannelDisConnect(rtc.client1.name)" :disabled="rtc.client1.channelState!=='OPEN'" type="primary" size="small">断开channel</el-button></el-col>
          </el-row>
          <el-row :gutter="10">
            <el-col :span="18"><el-input v-model="rtc.client1.message" placeholder="信息"/></el-col>
            <el-col :span="2"><el-button @click="testClientChannelSend(rtc.client1.name,rtc.client1.message)" :disabled="rtc.client1.channelState!=='OPEN'" type="primary">发送</el-button></el-col>
          </el-row>
          <el-row>
            <div class="msg-box">
            <div class="msg" style="display: flex" v-for="item in rtc.client1.msgList">
              <div class="msg-label">{{ rtc.client1.remoteClientID }}</div>
              <el-text>:</el-text>
              <div style="word-break: break-word">{{ item }}</div>
            </div>
          </div>
          </el-row>
        </el-card>-->
      </el-col>

      <el-col :span="12">


        <RTCChat
            :host="ws.client.host"
            :port="ws.client.port"
            :tls="ws.client.tls"
            :channel-state="rtc.client2.channelState"
            :rtc-state="rtc.client2.rtcState"
            :ws-state="rtc.client2.wsState"
            :name="rtc.client2.name"
            :client-id="rtc.client2.clientID"
            :remote-client-id.sync="rtc.client2.remoteClientID"
            :msg-list="rtc.client2.msgList"
        />
<!--        <el-card shadow="always">
          <h3>webrtc-client2</h3>
          <el-row :gutter="10">
            <el-button @click="testClientLogin(rtc.client2.name)" :disabled="rtc.client2.wsState!=='CLOSED'" type="primary">登录</el-button>&nbsp;
          </el-row>
          <el-row :gutter="10">
            <el-col :span="12"><el-input v-model="rtc.client2.remoteClientID" placeholder="远程ClientID"/></el-col>
            <el-col :span="1"><el-button @click="testClientConnect(rtc.client2.name,rtc.client2.remoteClientID)" :disabled="rtc.client2.wsState!=='OPEN'||rtc.client2.rtcState!=='CLOSED'" type="primary">连接</el-button></el-col>
          </el-row>
          <el-row>
            <el-col class="left"><el-text>clientID : {{ rtc.client2.clientID }}</el-text></el-col>
          </el-row>
          <el-row>
            <el-col class="left"><el-text>状态： {{ rtc.client2.state }}</el-text></el-col>
          </el-row>
          <el-row :gutter="1">
            <el-col :span="7"><el-button @click="testClientWsDisConnect(rtc.client2.name)" :disabled="rtc.client2.wsState!=='OPEN'" type="primary" size="small">断开ws</el-button></el-col>
            <el-col :span="8"><el-button @click="testClientRtcDisConnect(rtc.client2.name)" :disabled="rtc.client2.rtcState!=='CONNECTED'"  type="primary" size="small">断开rtc</el-button></el-col>
            <el-col :span="7"><el-button @click="testClientChannelDisConnect(rtc.client2.name)" :disabled="rtc.client2.channelState!=='OPEN'" type="primary" size="small">断开channel</el-button></el-col>
          </el-row>
          <el-row :gutter="10">
            <el-col :span="18"><el-input v-model="rtc.client2.message" placeholder="信息"/></el-col>
            <el-col :span="2"><el-button @click="testClientChannelSend(rtc.client2.name,rtc.client2.message)" :disabled="rtc.client2.channelState!=='OPEN'" type="primary">发送</el-button></el-col>
          </el-row>
          <el-row>
            <div class="msg-box">
              <div class="msg" style="display: flex" v-for="item in rtc.client2.msgList">
                <div class="msg-label">{{rtc.client2.remoteClientID}}</div>
                <el-text>:</el-text>
                <div style="word-break: break-word">{{ item }}</div>
              </div>
            </div>
          </el-row>
        </el-card>-->
      </el-col>

    </el-row>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import RTCChat from "@/frontEnd/v3/components/RTCChat.vue";
export default {
  name: "Chat",
  components:{
    RTCChat
  },
  data(){
    return {
      ws:{
        client:{
          clientID:'',
          message:'',
          tls:true,
          host:'127.0.0.1',
          port:6503,
          msgList:[],
          state:''
        },
        server:{
          message:'',
          msgList:[],
          state:''
        }
      },
      rtc:{
        client1:{
          name:'client1',
          clientID:'',
          remoteClientID:'',
          message:'',
          msgList:[],
          channelState:'',
          rtcState:'',
          wsState:''
        },
        client2:{
          name:'client2',
          clientID:'',
          remoteClientID:'',
          message:'',
          msgList:[],
          channelState:'',        //webrtc.通道连接状态
          rtcState:'',                 //webrtc连接状态
          wsState:''                  //ws登录状态
        }
      },
      turn:{
        state:''
      }
    }
  },
  async mounted(){
    let _this=this;
    window.wsClient.onWsConnect(clientID=>_this.ws.client.clientID=clientID);
    window.wsClient.onWsMessage(data=>_this.ws.client.msgList.push(data));
    window.wsClient.onWsMessageSend(data=>_this.ws.client.msgList.push(data));
    window.wsClient.onWsError(event=>ElMessage('ws error'+event));
    window.wsClient.onWsClose(event=>ElMessage('ws close'+event));

    window.wsServer.onMessage(data=>_this.ws.server.msgList.push(data));
    window.wsServer.onMessageSend(data=>_this.ws.server.msgList.push(data));

    window.testWsClient.onWsConnect((name,clientID)=>{
      _this.rtc[name].clientID=clientID;
      _this.rtc[name==='client1'?'client2':'client1'].remoteClientID=clientID;
    });
    //window.testWsClient.onWsMessage((name,data)=>_this.rtc[name].msgList.psuh(data));
    //window.testWsClient.onWsMessageSend((name,data)=>_this.rtc[name].msgList.psuh(data));
    window.testWsClient.onWsError((name,event)=>{
      _this.rtc[name].wsState='CLOSED';
      ElMessage(`ws ${name} error ${event}`)
    });
    window.testWsClient.onWsClose((name,event)=>{
      _this.rtc[name].wsState='CLOSED';
      ElMessage(`ws ${name} close ${event}`)
    });

    window.testWebrtc.onRtcConnect((name,remoteClientID,event)=>ElMessage(`rtc ${name} connect ${remoteClientID}`));
    window.testWebrtc.onRtcError((name,event)=>{
      _this.rtc[name].rtcState='FAILED';
      ElMessage(`rtc ${name} error ${event}`)
    });
    window.testWebrtc.onRtcClose((name,event)=>{
      _this.rtc[name].rtcState='CLOSED';
      ElMessage(`rtc ${name} close ${event}`)
    });

    window.testWebrtc.onChannelOpen((name)=>ElMessage(`rtc  channel ${name} open`));
    window.testWebrtc.onChannelMessage((name,data)=>{
      _this.rtc[name].msgList.push({message:data.data.message,remoteClientID:_this.rtc[name].remoteClientID})
    });
    window.testWebrtc.onChannelError((name,event)=>{
      _this.rtc[name].channelState='CLOSED';
      ElMessage(`rtc  channel ${name} error ${event}`)
    });
    window.testWebrtc.onChannelClose((name,event)=>{
      _this.rtc[name].channelState='CLOSED';
      ElMessage(`rtc  channel ${name} close ${event}`)
    });
    this.states(true);
    setInterval(this.states,5000);
  },
  methods:{
    async states(initInput=true){
      let serverState=await window.wsServer.state();
      this.turn.state=serverState.turn;
      this.ws.server.state=serverState.ws;

      let clientState=await window.wsClient.state();
      this.ws.client.clientID=clientState.clientID;
      this.ws.client.state=clientState.wsState;

      let rtc1State=await window.testWebrtc.state(this.rtc.client1.name);
      let rtc2State=await window.testWebrtc.state(this.rtc.client2.name);

      this.rtc.client1.clientID=rtc1State.clientID;
      this.rtc.client1.channelState=rtc1State.channelState;
      this.rtc.client1.wsState=rtc1State.wsState;
      this.rtc.client1.rtcState=rtc1State.rtcState;

      this.rtc.client2.clientID=rtc2State.clientID;
      this.rtc.client2.channelState=rtc2State.channelState;
      this.rtc.client2.wsState=rtc2State.wsState;
      this.rtc.client2.rtcState=rtc2State.rtcState;
      if(initInput) {
        this.rtc.client1.remoteClientID = rtc1State.remoteClientID;
        this.rtc.client2.remoteClientID=rtc2State.remoteClientID;
      }
    },
    wsServerStartup(){
      window.wsServer.startup();
    },
    wsServerTerminate(){
      window.wsServer.terminate();
    },
    turnStartup(){
      window.turn.startup();
    },
    turnTerminate(){
      window.turn.terminate();
    },
    wsClientConnect(){
      window.wsClient.connect({
        tls:this.ws.client.tls,
        host:this.ws.client.host,
        port:this.ws.client.port,
      });
    },
    wsClientDisConnect(){
      window.wsClient.terminate();
    },
    wsClientSend(){
      window.wsClient.send({message:this.ws.client.message},1);
    },
    wsServerSend(){
      window.wsServer.send({message:this.ws.server.message});
    },

    /*testClientLogin(name){
      window.testWsClient.connect(name,{tls:this.ws.client.tls,host:this.ws.client.host,port:this.ws.client.port});
      //window.testWebrtc.rtcConnect(name,{remoteClientID});
    },
    testClientConnect(name,remoteClientID){
      window.testWebrtc.channelConnect(name,{remoteClientID});
    },
    testClientChannelSend(name,message){
      window.testWebrtc.channelSend(name,message);
    },
    testClientWsDisConnect(name){
      window.testWsClient.terminate(name);
    },
    testClientRtcDisConnect(name){
      window.testWebrtc.rtcTerminate(name);
    },
    testClientChannelDisConnect(name){
      window.testWebrtc.channelTerminate(name);
    }*/

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