<template>
  <div>
    <el-row :gutter="10">
      <el-col>
        <el-card shadow="always">
          <el-row style="margin: 10px 0">
            <el-col :span="7" style="text-align: left"><span style="padding:0 10px 0 0;line-height: 32px">websocket服务器:</span></el-col>
            <el-col :span="1.5" style="text-align: left"><el-button type="primary" style="margin: 0 6px" @click="wsServerStartup">启动</el-button></el-col>
            <el-col :span="1.5" style="text-align: left"><el-button type="primary" style="margin: 0 6px" @click="wsServerTerminate">停止</el-button></el-col>
          </el-row>
          <el-row>
            <el-col :span="7" style="text-align: left"><span style="padding:0 10px 0 0;line-height: 32px">turn服务器:</span></el-col>
            <el-col :span="1.5" style="text-align: left"><el-button type="primary" style="margin: 0 6px" @click="turnStartup">启动</el-button></el-col>
            <el-col :span="1.5" style="text-align: left"><el-button type="primary" style="margin: 0 6px" @click="turnTerminate">停止</el-button></el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="10" style="margin: 10px 0">
      <el-col :span="12">
        <el-card shadow="always">
              <h3 style="margin: 0 0 20px 0">websocket客户端</h3>
              <el-row style="margin: 10px 0" :gutter="1">
                <el-col :span="4.5">https:&nbsp;<el-switch v-model="ws.client.tls"/>&nbsp;</el-col>
                <el-col :span="8"><el-input placeholder="地址" v-model="ws.client.host"/></el-col>
                <el-col :span="0.5"><span style="padding:0 2px;line-height: 32px">:</span></el-col>
                <el-col :span="3"><el-input placeholder="端口" v-model="ws.client.port"/></el-col>
                <el-col :span="2.5"><el-button type="primary" style="margin: 0 8px" @click="wsClientConnect">连接</el-button></el-col>
              </el-row>
              <el-row style="margin: 10px 0">
                  <el-col :span="1">ClientID：</el-col>
                  <el-col :span="5">{{ws.client.clientID}}</el-col>
              </el-row>
              <el-row :gutter="10">
                <el-col :span="18"><el-input placeholder="信息" v-model="ws.client.message"/></el-col>
                <el-col :span="2"><el-button type="primary" @click="wsClientSend">发送</el-button></el-col>
              </el-row>
              <el-row>
                  <div class="msg-box">
                      <div class="msg" style="display: flex" v-for="item in ws.client.msgList">
                        <div style="min-width: 10%;max-width: 25%;" class="msg-label">[{{ item.time }}]{{ item.from }}</div>
                        <div style="line-height: 16px;margin-right: 2px" >：</div>
                        <div style="word-break: break-word">{{ item.message }}</div>
                      </div>
                  </div>
              </el-row>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="always">
            <h3 style="margin: 0 0 20px 0">websocket服务端</h3>
           <el-row style="margin: 36px 0" :gutter="1">&nbsp;</el-row>
            <el-row :gutter="10">
              <el-col :span="18"><el-input placeholder="信息" v-model="ws.server.message"/></el-col>
              <el-col :span="2"><el-button type="primary" @click="wsServerSend">发送</el-button></el-col>
            </el-row>
            <el-row>
              <div class="msg-box">
                <div class="msg" style="display: flex" v-for="item in ws.server.msgList">
                  <div style="min-width: 10%;max-width: 25%;" class="msg-label">[{{ item.time }}]{{ item.from }}</div>
                  <div style="line-height: 16px;margin-right: 2px" >：</div>
                  <div style="word-break: break-word">{{ item.message }}</div>
                </div>
              </div>
            </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="10">
      <el-col :span="12">
        <el-card shadow="always">
          <h3 style="margin: 0 0 20px 0">webrtc-client1</h3>
          <el-row style="margin: 10px 0" :gutter="10">
              <el-button type="primary" @click="testClientLogin(rtc.client1.name)">登录</el-button>&nbsp;
              <el-text>{{  }}</el-text>
          </el-row>
          <el-row style="margin: 10px 0" :gutter="10">
              <el-col :span="12"><el-input placeholder="远程ClientID" v-model="rtc.client1.remoteClientID"/></el-col>
              <el-col :span="1"><el-button type="primary" @click="testClientConnect(rtc.client1.name)">连接</el-button></el-col>
          </el-row>
          <el-row :gutter="10">
            <el-col :span="18"><el-input placeholder="信息" v-model="rtc.client1.msg"/></el-col>
            <el-col :span="2"><el-button type="primary" @click="testClientSend(rtc.client2.name)">发送</el-button></el-col>
          </el-row>
          <el-row>
            <div class="msg-box">
            <div class="msg" style="display: flex" v-for="item in rtc.client1.msgList">
              <div style="min-width: 10%;max-width: 25%;" class="msg-label">[{{ item.time }}]{{ item.from }}</div>
              <div style="line-height: 16px;margin-right: 2px" >：</div>
              <div style="word-break: break-word">{{ item.message }}</div>
            </div>
          </div>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="always">
          <h3 style="margin: 0 0 20px 0">webrtc-client2</h3>
          <el-row style="margin: 10px 0" :gutter="10">
            <el-button type="primary" @click="testClientLogin(rtc.client2.name)">登录</el-button>&nbsp;
            <el-text>{{  }}</el-text>
          </el-row>
          <el-row style="margin: 10px 0" :gutter="10">
            <el-col :span="12"><el-input placeholder="远程ClientID" v-model="rtc.client2.remoteClientID"/></el-col>
            <el-col :span="1"><el-button type="primary" @click="testClientConnect(rtc.client2.name)">连接</el-button></el-col>
          </el-row>
          <el-row :gutter="10">
            <el-col :span="18"><el-input placeholder="信息"/></el-col>
            <el-col :span="2"><el-button type="primary" @click="testClientSend(rtc.client2.name)">发送</el-button></el-col>
          </el-row>
          <el-row>
            <div class="msg-box">
              <div class="msg" style="display: flex" v-for="item in rtc.client2.msgList">
                <div style="min-width: 10%;max-width: 25%;" class="msg-label">[{{ item.time }}]{{ item.from }}</div>
                <div style="line-height: 16px;margin-right: 2px" >：</div>
                <div style="word-break: break-word">{{ item.message }}</div>
              </div>
            </div>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: "Chat",
  data(){
    return {
      ws:{
        client:{
          clientID:'',
          message:'',
          msgList:[],

          tls:true,
          host:'',
          port:''
        },
        server:{
          message:'',
          msgList:[]
        }
      },
      rtc:{
        client1:{
          remoteClientID:'',
          msg:'',
          name:'client-1',
          msgList:[]
        },
        client2:{
          remoteClientID:'',
          msg:'',
          name:'client-2',
          msgList:[]
        }
      }
    }
  },
  mounted(){
    window.wsClient.onMessage(function(data){
      this.ws.client.msgList.push(data);
    })
  },
  methods:{
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
    wsClientSend(){
      window.wsClient.send({message:this.ws.client.message},this.client1);
    },
    wsServerSend(){
      window.wsServer.send({message:this.ws.server.message});
    },

    testClientLogin(name){
      window.testWebrtc.rtcLogin({
        tls:this.ws.client.tls,
        host:this.ws.client.host,
        port:this.ws.client.port,
      },name)
    },
    testClientConnect(name){
      window.testWebrtc.rtcChannelConnect({
        remoteClientID: name === this.rtc.client1.name?this.rtc.client1.remoteClientID:this.rtc.client2.remoteClientID
      },name);
    },
    testClientSend(name){
      window.testWebrtc.rtcChannelSend(name === this.rtc.client1.name?this.rtc.client1.msg:this.rtc.client2.msg,name);
    },

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
  }
  .msg{
    margin: 4px;
  }
  .msg>div{
    word-break: break-word;
  }
</style>