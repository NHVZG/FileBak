<template>
  <div>
    <el-card>
      <el-row :gutter="4">
        <el-col :span="6" style="min-width: 60px;max-width: 60px">服务端</el-col>
        <el-col :span="6" style="min-width: 160px;max-width: 200px;">
          <el-row class="margin-row">
            <el-col :span="12" class="text-left">web服务：</el-col>
            <el-col :span="12"><el-text :type="server.states.web==='RUNNING'?'success':'danger'">{{server.states.web}}</el-text></el-col>
          </el-row>
          <el-row class="margin-row">
            <el-col :span="12" class="text-left">ws服务：</el-col>
            <el-col :span="12"><el-text :type="server.states.ws==='RUNNING'?'success':'danger'">{{server.states.ws}}</el-text></el-col>
          </el-row>
          <el-row class="margin-row">
            <el-col :span="12" class="text-left">端口：</el-col>
            <el-col :span="12"><el-text>{{server.states.port}}</el-text></el-col>
          </el-row>
              <div class="margin-row text-left">
                <el-button type="primary" @click="this.server.startup()">启动</el-button>
                <el-button type="primary" @click="this.server.terminate()">停止</el-button>
              </div>
        </el-col>
        <el-col style="flex:1;flex-grow: 1">
          <el-row>
            <el-col>
              <el-row :gutter="4" class="margin-row">
                <el-col :span="24" style="flex:1">
                  <el-input v-model="data.server.text"></el-input>
                </el-col>
                <el-col :span="12" style="max-width:50px;min-width: 50px;">
                  <el-button type="primary" @click="server.sendWs(data.server.text)">发送</el-button>
                </el-col>
              </el-row>
            </el-col>
            <el-col>
              <el-scrollbar height="100" class="chat-block">
                <div v-for="item in data.server.msg">
                  <el-tag type="success">{{item.msgType}}</el-tag>
                  <el-text :title="item.time">【<el-text type="primary">{{item.from}}</el-text>】</el-text>
                  <el-text>{{item.data.data.text}}</el-text>
                </div>
              </el-scrollbar>
            </el-col>
          </el-row>
        </el-col>
      </el-row>
    </el-card>
    <p></p>

    <el-row :gutter="6">
      <el-col :span="12">
        <el-card>
          <el-row :gutter="4">
            <el-col :span="6" style="min-width: 70px;max-width: 10px">客户端1</el-col>
            <el-col :span="24" style="min-width: 160px;" class="text-left">
              <el-row class="margin-row">
                <el-col :span="9" style="max-width: 80px">ID：</el-col>
                <el-col :span="15"><el-text>{{client1.clientID}}</el-text></el-col>
              </el-row>
              <el-row class="margin-row">
                <el-col :span="9" style="max-width: 80px">ws状态：</el-col>
                <el-col :span="15"><el-text :type="client1.states.ws==='OPEN'?'success':'danger'">{{client1.states.ws}}</el-text></el-col>
              </el-row>
              <el-row class="margin-row">
                <el-col :span="9" style="max-width: 80px">rtc状态：</el-col>
                <el-col :span="15"><el-text :type="client1.states.rtc==='CONNECTED'?'success':'danger'">{{client1.states.rtc}}</el-text></el-col>
              </el-row>
              <el-row class="margin-row">
                <el-col :span="9" style="max-width: 80px">channel状态：</el-col>
                <el-col :span="15"><el-text :type="client1.states.channel==='OPEN'?'success':'danger'">{{client1.states.channel}}</el-text></el-col>
              </el-row>
              <el-row class="margin-row">
                <el-col :span="9" style="max-width: 80px;">ws:</el-col>
                <el-col :span="15" class="text-left">
                  <el-button size="small" type="primary" @click="client1.connectWs()">连接</el-button>
                  <el-button size="small" type="primary" @click="client1.closeWs()">断开</el-button>
                </el-col>
              </el-row>
              <el-row class="margin-row">
                <el-col :span="9" style="max-width: 80px">rtc:</el-col>
                <el-col :span="15" class="text-left">
                  <el-button size="small" type="primary" @click="client1.closeRtc()">断开</el-button>
                </el-col>
              </el-row>
              <el-row class="margin-row">
                <el-col :span="9" style="max-width: 80px">channel:</el-col>
                <el-col :span="15" class="text-left">
                  <el-button size="small" type="primary" @click="client1.connectChannel(clone(conf.client1))">连接</el-button>
                  <el-button size="small" type="primary" @click="client1.closeChannel()">断开</el-button>
                </el-col>
              </el-row>
            </el-col>
          </el-row>
          <el-row class="margin-row">
            <el-input v-model="conf.client1.remoteClientID" placeholder="对方ID,空则服务器接收"/>
          </el-row>
          <el-row :gutter="4" class="margin-row">
            <el-col :span="24" style="flex:1">
              <el-input v-model="data.client1.text"></el-input>
            </el-col>
            <el-col :span="12" style="max-width:50px;min-width: 50px;">
              <el-button type="primary" @click="client1.send(data.client1.text,conf.client1.remoteClientID)">发送</el-button>
            </el-col>
          </el-row>
          <el-row>
            <el-col>
            <el-scrollbar height="100" class="chat-block">
              <div v-for="item in data.client1.msg">
                <el-tag :type="item.msgType==='rtc'?'warning':'success'">{{item.msgType}}</el-tag>
                <el-text :title="item.time">【<el-text type="primary">{{item.from}}</el-text>】</el-text>
                <el-text>{{item.data.data.text}}</el-text>
              </div>
            </el-scrollbar>
            </el-col>
          </el-row>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <el-row :gutter="4">
            <el-col :span="6" style="min-width: 70px;max-width: 10px">客户端2</el-col>
            <el-col :span="24" style="min-width: 160px;" class="text-left">
              <el-row class="margin-row">
                <el-col :span="9" style="max-width: 80px">ID：</el-col>
                <el-col :span="15"><el-text>{{client2.clientID}}</el-text></el-col>
              </el-row>
              <el-row class="margin-row">
                <el-col :span="9" style="max-width: 80px">ws状态：</el-col>
                <el-col :span="15"><el-text :type="client2.states.ws==='OPEN'?'success':'danger'">{{client2.states.ws}}</el-text></el-col>
              </el-row>
              <el-row class="margin-row">
                <el-col :span="9" style="max-width: 80px">rtc状态：</el-col>
                <el-col :span="15"><el-text :type="client2.states.rtc==='CONNECTED'?'success':'danger'">{{client2.states.rtc}}</el-text></el-col>
              </el-row>
              <el-row class="margin-row">
                <el-col :span="9" style="max-width: 80px">channel状态：</el-col>
                <el-col :span="15"><el-text :type="client2.states.channel==='OPEN'?'success':'danger'">{{client2.states.channel}}</el-text></el-col>
              </el-row>
              <el-row class="margin-row">
                <el-col :span="9" style="max-width: 80px;">ws:</el-col>
                <el-col :span="15" class="text-left">
                  <el-button size="small" type="primary" @click="client2.connectWs()">连接</el-button>
                  <el-button size="small" type="primary" @click="client2.closeWs()">断开</el-button>
                </el-col>
              </el-row>
              <el-row class="margin-row">
                <el-col :span="9" style="max-width: 80px">rtc:</el-col>
                <el-col :span="15" class="text-left">
                  <el-button size="small" type="primary" @click="client2.closeRtc()">断开</el-button>
                </el-col>
              </el-row>
              <el-row class="margin-row">
                <el-col :span="9" style="max-width: 80px">channel:</el-col>
                <el-col :span="15" class="text-left">
                  <el-button size="small" type="primary" @click="client2.connectChannel(clone(conf.client2))">连接</el-button>
                  <el-button size="small" type="primary" @click="client2.closeChannel()">断开</el-button>
                </el-col>
              </el-row>
            </el-col>
          </el-row>
          <el-row class="margin-row">
            <el-input v-model="conf.client2.remoteClientID" placeholder="对方ID,空则服务器接收"/>
          </el-row>
          <el-row :gutter="4" class="margin-row">
            <el-col :span="24" style="flex:1">
              <el-input v-model="data.client2.text"></el-input>
            </el-col>
            <el-col :span="12" style="max-width:50px;min-width: 50px;">
              <el-button type="primary" @click="client2.send(data.client2.text,conf.client2.remoteClientID)">发送</el-button>
            </el-col>
          </el-row>
          <el-row>
            <el-col>
              <el-scrollbar height="100" class="chat-block">
                <div v-for="item in data.client2.msg">
                  <el-tag :type="item.msgType==='rtc'?'warning':'success'">{{item.msgType}}</el-tag>
                  <el-text :title="item.time">【<el-text type="primary">{{item.from}}</el-text>】</el-text>
                  <el-text>{{item.data.data.text}}</el-text>
                </div>
              </el-scrollbar>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <p></p>

    <el-row :gutter="6">
      <el-col :span="12">
        <el-card>
          <el-row :gutter="4" class="margin-row">
            <el-col :span="24" style="flex:1">
              <el-input v-model="data.leftBase"></el-input>
            </el-col>
            <el-col :span="12" style="max-width:50px;min-width: 50px;">
              <el-button type="primary" @click="browserLeftTree">浏览</el-button>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <el-row :gutter="4" class="margin-row">
            <el-col :span="24" style="flex:1">
              <el-input v-model="data.rightBase"></el-input>
            </el-col>
            <el-col :span="12" style="max-width:50px;min-width: 50px;">
              <el-button type="primary" @click="browserRightTree">浏览</el-button>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <FileDiffv7 :lazy="true" :load-base-children="loadLeftLocal" :load-compared-children="loadRightRemote" :conf="rules.upload" ref="fileDiff"/>
  </div>
</template>

<script>

import {ElMessage, ElNotification} from "element-plus";
import {Server,Client} from "@/frontEnd/v4/common/webrtc";
import {Rule} from "@/backend/v4/core/module/fileDiff/fileDiff";
import {nextTick, reactive} from "vue";
import {time} from "@/frontEnd/v4/util/util";
import {buildFileNode} from "@/frontEnd/v4/common/files";
import { v4 as uuidv4 } from 'uuid';
import FileDiffv7 from "@/frontEnd/v4/components/FileDiffv7.vue";

export default {
  components:{
    FileDiffv7
  },
  data() {
    return {
      server:null,
      client1:null,
      client2:null,
      localClient:null,
      data:{
        registerRequest:{},
        server:{text:'',msg:[]},
        client1:{text:'',msg:[]},
        client2:{text:'',msg:[]},
        leftBase:'D:/Test/base',
        rightBase:'D:/Test/compared',
      },
      state:{
        server:{ws:'CLOSED',web:'CLOSED'},
        client1:{ws:'CLOSED',rtc:'CLOSED',channel:'CLOSED'},
        client2:{ws:'CLOSED',rtc:'CLOSED',channel:'CLOSED'},
        ws:'CLOSED'
      },
      conf:{
        client1:{
          ws:{tls:true,host:'127.0.0.1',port:2080},
          remoteClientID:''
        },
        client2:{
          ws:{tls:true,host:'127.0.0.1',port:2080},
          remoteClientID:''
        },
        server:{
          ws:{tls:true,port:2080}
        }
      },
      rules:{
        upload:[
            {base: 'D:/Test/base', relative: '', target: 'D:/Test/compared', mode: 'mapping'},
            {base: 'D:/Test/base', relative: 'a.txt', target: 'D:/Test/compared/d.txt', mode: 'mapping',pruning:true},
            //{base: 'D:/Test/compared/d.txt', relative: '', mode: 'incrementUpdate',dispatch:Rule.DISPATCH_TARGET},
            {base: 'D:/Test/base/a/a.txt', relative: '', mode: 'increment'},
            {base: 'D:/Test/base/c.txt', relative: '', mode: 'update'},
            {base: 'D:/Test/base/b/bb', relative: '', mode: 'cover'},
            {base: 'D:/Test/base/c', relative: '',target: 'D:/Test/compared/从', mode: 'mapping',pruning:true},
            {base: 'D:/Test/compared/从', relative: '', mode: 'increment',dispatch:Rule.DISPATCH_TARGET},
            //{base: 'D:/Test/base', relative: 'b.txt', target: 'D:/Test/compared/d.txt', mode: 'mapping'},
            //{base: 'D:/Test/compared', mode: 'increment'},
        ],
        download:{}
      }
    }
  },
  created() {
    this.server=reactive(new Server({
      onWsServerMsg:(content)=>this.data.server.msg.push({...content,msgType:'ws'}),//({data})=>ElNotification({title:'ws服务端收到消息',message:data.text}),
      onWsServerMsgSend:(content)=>this.isMsg(content)&&this.data.server.msg.push({...content,msgType:'ws'})
    },this.clone(this.conf.server.ws)));
    this.localClient=this.client1=reactive(new Client('client1',{
      onChannelMsg:(data,msg)=>this.data.client1.msg.push({data,msgType:'rtc',time:time(),from:this.client1.remoteClientID}),
      onWsMsg:(content)=>this.data.client1.msg.push({...content,msgType:'ws '}),//({data})=>ElNotification({title:'ws客户端1收到消息',message:data.text}),
      onWsMsgSend:(content)=>this.isMsg(content)&&this.data.client1.msg.push({...content,msgType:'ws'}),
    },this.clone(this.conf.client1)));
    this.client2=reactive(new Client('client2',{
      onChannelMsg:(data,msg)=>this.data.client2.msg.push({data,msgType:'rtc',time:time(),from:this.client2.remoteClientID}),
      onWsMsg:(content)=>this.data.client2.msg.push({...content,msgType:'ws '}),//({data})=>ElNotification({title:'ws客户端2收到消息',message:data.text}),
      onWsMsgSend:(content)=>this.isMsg(content)&&this.data.client2.msg.push({...content,msgType:'ws'}),
    },this.clone(this.conf.client2)));
  },
  async mounted() {
    //window.chat.onChannelMsg((...arg)=>console.log(arg));
    setInterval(async ()=>{
      this.server.sync();
      this.client1.sync();
      this.client2.sync();
    },1000);


    setTimeout(()=>{
      if(this.localClient.states.channel==='OPEN') {
        this.browserRightTree();
      }
    },2000);
    setTimeout(()=>{
      if(this.localClient.states.channel==='OPEN') {
        this.browserLeftTree();
      }
    },3000)

    window.files.onFileStructReply(this.localClient.name,({struct,requestId})=>{
      let callback=this.data.registerRequest[requestId];
      if(callback){
        callback(struct);
      }
    });
  },
  methods:{
    async test(){
      window.files.onFileStructReply('client1',(struct)=>{
        console.log(struct);
      });
      await window.files.remoteDir(this.client1.name,{base:'D:/'});
    },
    isMsg(content){
      return content.data.type==='ws-msg'||content.data.type==='ws-msg-transfer'
    },
    clone(obj){
      return JSON.parse(JSON.stringify(obj));
    },


    //.浏览本地目录
    async browserLeftTree(){
      let struct=await this.localFile(this.data.leftBase);
      this.$refs.fileDiff.setLeftTree(buildFileNode(struct),this.data.leftBase);
    },

    //.浏览远程目录
    browserRightTree(){
      this.remoteFile(this.data.rightBase,(struct)=>{
        this.$refs.fileDiff.setRightTree(buildFileNode(struct),this.data.rightBase);
      });
    },

    //. 加载本地子节点
    async loadLeftLocal(node,resolve){
      if (node.level === 0) {
        return;//resolve([{ name: 'root' }])
      }
      let struct=await this.localFile(node.data.path);
      resolve(buildFileNode(struct));
    },

    //. 加载远程子节点
    async loadRightRemote(node,resolve){
      if (node.level === 0) {
        return;//resolve([{ name: 'root' }])
      }
      this.remoteFile(node.data.path,(struct)=>{
        resolve(buildFileNode(struct));
      });
    },


    //. 本地文件结构
    async localFile(base){
      let struct=await window.files.dir({base});
      return await struct;
    },

    //. 远程文件结构
    remoteFile(base,callback){
      let id=uuidv4();
      this.data.registerRequest[id]=callback;
      window.files.remoteDir(this.localClient.name,{base,requestId:id});
    },

  }
}
</script>

<style>
.el-form-item__label {
  font-size: 20px;
}

.margin-row{
  margin: 0 0 4px;
}
.text-left{
  text-align: left;
}
.chat-block{
  text-align: left;
  border: 1px solid var(--el-border-color);
  padding: 1px
}
</style>