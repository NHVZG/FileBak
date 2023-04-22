<template>
  <el-form-item style="width: 50%">
    <el-switch active-text="服务器" inactive-text="客户端" v-model="isServer"/>
  </el-form-item>
  <el-form-item style="width: 50%" v-if="isServer">
    <el-button type="primary" @click="startup">启动</el-button>
    <el-button type="primary" @click="terminate">停止</el-button>
  </el-form-item>
  <el-form-item style="width: 50%" v-if="!isServer">
     <el-col :span="10" style="margin-right: 4px">
        <el-input placeholder="远程ip" v-model="host"/>
     </el-col>
    <el-col :span="5" style="margin-right: 4px">
      <el-input placeholder="远程端口" v-model="port"/>
    </el-col>
    <el-col :span="4">
        <el-button type="primary" @click="connect">连接</el-button>
    </el-col>
  </el-form-item>
  <el-form-item>
    <el-col :span="5" style="margin-right: 4px">
      <el-input type="textarea" resize="none" input-style="height:200px" v-model="msg"/>
    </el-col>
    <el-col :span="10">
        <div style="height: 200px;" class="chat-area">
            <p style="text-align: left;" v-for="item in history" class="chat-item">
              {{`[${item.time}] ${item.clientID}:  ${item.msg}`}}
            </p>
        </div>
    </el-col>
  </el-form-item>
  <el-form-item>
    <el-button type="primary" @click="send" :disabled="isServer?false:!connected">发送</el-button>
  </el-form-item>
</template>

<script>
import {__isSuccess} from "@/frontEnd/v1/utils/util";

export default {
  name: "Chat",
  data(){
    return{
      isServer:false,
      host:'192.168.1.5',
      port:'6503',
      msg:'',
      connected:false,
      history:[]
    }
  },
  mounted() {
    window.wsServer.onMsg(this.onMsg);
  },
  methods:{
    onMsg(event,clientID,msg){
      this.history.push({
        time:new Date().toLocaleDateString(),
        clientID:clientID,
        msg:msg
      });
    },
    terminate(){
      window.wsServer.terminate();
    },
    startup(){
      let result=window.wsServer.startup();
    },
    connect(){
      this.connected=window.wsClient.connect({host:this.host,port:this.port});
    },
    send(){
      (this.isServer?window.wsServer:window.wsClient).send(this.msg);
    }
  }
}
</script>

<style scoped>
.chat-item{
  margin: 2px;
  line-height: 16px
}
.chat-area{
  border: 1px solid rgb(199 199 199);
  background-color: #f2f2f2
}
</style>