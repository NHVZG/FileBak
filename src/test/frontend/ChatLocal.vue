<template>
  <el-form-item>
    <el-col :span="7">
      <el-input v-model="host"/>
    </el-col>
    <el-col :span="5">
      <el-input v-model="port"/>
    </el-col>
    <el-col :span="5">
      <el-button type="primary" @click="connect">连接</el-button>
    </el-col>
    <el-col :span="2">
      <el-button type="primary" @click="startup">启动ws</el-button>
    </el-col>
    <el-col :span="2">
      <el-button type="primary" @click="terminate">停止</el-button>
    </el-col>
  </el-form-item>
  <el-form-item>
    <el-button type="primary" @click="startupTurn">启动turn</el-button>
    <el-button type="primary" @click="terminateTurn">停止turn</el-button>
    <br>
    <el-button type="primary" @click="start">start</el-button>
    <el-button type="primary" @click="sendChannel">sendrtc</el-button>
    <el-input v-model="rtcAddr" />
  </el-form-item>
  <el-form-item>
    <el-col :span="10">
        <span style="float: left"> 客户端：</span><br>
        <el-form-item>
          <el-col :span="10">
            <el-input v-model="client"/>
          </el-col>
          <el-col :span="2">
            <el-button @click="clientSend">发送</el-button>
          </el-col>
        </el-form-item>
      <div style="height: 200px;" class="chat-area">
        <p style="text-align: left;" v-for="item in clientHistory" class="chat-item">
          {{`[${item.time}] ${item.clientID}:  ${item.msg}`}}
        </p>
      </div>
    </el-col>
    <el-col :span="10">
      <span style="float: left"> 服务端：</span><br/>
      <el-form-item>
        <el-col :span="10">
        <el-input v-model="server"/>
        </el-col>
        <el-col :span="2">
        <el-button @click="serverSend">发送</el-button>
        </el-col>
      </el-form-item>
      <div style="height: 200px;" class="chat-area">
        <p style="text-align: left;" v-for="item in serverHistory" class="chat-item">
          {{`[${item.time}] ${item.clientID}:  ${item.msg}`}}
        </p>
      </div>
    </el-col>
  </el-form-item>

</template>

<script>
export default {
  name: "ChatLocal",
  data(){
    return {
      host:'127.0.0.1',
      port:6503,
      client:'',
      server:"",
      clientHistory:[],
      serverHistory:[],
      rtcAddr:''
    }
  },
  mounted() {
    window.wsServer.onMsg(this.onServerMsg);
    window.wsClient.onMsg(this.onClientMsg);
    window.wsClient.onConnect(this.onClientConnect);
  },
  methods:{
    onClientConnect(event,clientID){
      console.log(clientID);
    },
    onClientMsg(event,clientID,msg){
      this.clientHistory.push({
        time:new Date().toLocaleDateString(),
        clientID:clientID,
        msg:msg
      });
    },
    onServerMsg(event,clientID,msg){
      this.serverHistory.push({
        time:new Date().toLocaleDateString(),
        clientID:clientID,
        msg:msg
      });
    },
    connect(){
      this.connected=window.wsClient.connect({host:this.host,port:this.port});
    },
    clientSend(){
        window.wsClient.send(this.client);
    },
    serverSend(){
      window.wsServer.send(this.server);
    },
    startup(){
      let result=window.wsServer.startup();
    },
    terminate(){
      window.wsServer.terminate();
    },
    startupTurn(){
      window.turnServer.startup();
    },
    terminateTurn(){
      window.turnServer.terminate();
    },
    start(){
      window.webrtc.test(this.rtcAddr);
    },
    sendChannel(){
      window.webrtc.test1();
    }
  }
}
</script>

<style scoped>

</style>