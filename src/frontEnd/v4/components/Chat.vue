<template>
  <div>
    <el-button @click="test">test</el-button>
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
          <el-row style="text-align: right">
            <el-col :span="24"><el-icon :size="20" color="white" class="transport"><CaretRight /></el-icon></el-col>
          </el-row>
          <el-row :gutter="4" class="margin-row">
            <el-col :span="24" style="flex:1">
              <el-input v-model="data.left.base"></el-input>
            </el-col>
            <el-col :span="12" style="max-width:50px;min-width: 50px;">
              <el-button type="primary" @click="browser(this.data.left)">浏览</el-button>
            </el-col>
          </el-row>
          <el-row>
            <el-col>
              <el-button @click="syncFileListInit">初始化</el-button>
              <el-button @click="data.transportDialog=true">传输</el-button>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <el-row style="text-align: left">
            <el-col :span="24"><el-icon :size="20" color="white" class="transport"><CaretLeft /></el-icon></el-col>
          </el-row>
          <el-row :gutter="4" class="margin-row">
            <el-col :span="24" style="flex:1">
              <el-input v-model="data.right.base"></el-input>
            </el-col>
            <el-col :span="12" style="max-width:50px;min-width: 50px;">
              <el-button type="primary" @click="browser(this.data.right)">浏览</el-button>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-row>
      <el-col :span="24">
    <FileDiffv7 :lazy="true" :load-left-children="load('left')" :load-right-children="load('right')" :conf="rules.upload" ref="fileDiff"/>
      </el-col>
    </el-row>
<!--    <el-row>
      <el-col :span="24">
    <FileDiffv7 :lazy="true" :load-base-children="loadLeftLocal" :load-compared-children="loadRightRemote" :conf="rules.upload" ref="fileDiff1"/>
      </el-col>
    </el-row>-->

    <el-dialog v-model="data.transportDialog" :show-close="true" style="max-height: 78%;min-width: 500px;max-width: 90%">
      <template #header="{ close, titleId, titleClass }"><div style="text-align: left;font-weight: bold;color: #787878">传输列表</div></template>
      <el-row :gutter="6" style="padding:0 4px;font-weight: 400;color: #9b9b9b;font-size: 10px;">
        <el-col :span="8" style="text-align: left;padding-left:20px">源文件</el-col>
        <el-col :span="8" style="text-align: left;padding-left:10px">目标文件</el-col>
        <el-col :span="5">进度</el-col>
        <el-col :span="3">操作</el-col>
      </el-row>
      <el-scrollbar style="height: 450px;overflow: auto;text-align: left;padding:0 4px">
        <div v-for="item in data.fileList" class="file-item">
          <div class="file-item-content">
            <el-row :gutter="6">
              <el-col :span="8">
                <div v-for="s in item.source" class="file-item-source" :title="s.source+'>'+s.target">
                  {{s.source}}<br>
                </div>
              </el-col>
              <el-col :span="8" style="display: flex;align-items: center">
                <div class="file-item-source" :title="item.target">
                  {{item.target}}<br>
                </div>
              </el-col>
              <el-col :span="5" style="display: flex;" class="file-item-action">
                <div style="width: 100%">
                  <el-progress :text-inside="true" :stroke-width="14" :percentage="item.percent||0" :status="item.percent===100?'success':''"/>
                </div>
              </el-col>
              <el-col :span="3" style="display: flex;" class="file-item-action">
                <el-button size="small" type="primary" @click="sendFile(item)">传输</el-button>
              </el-col>
            </el-row>

          </div>
        </div>
      </el-scrollbar>
    </el-dialog>

  </div>
</template>

<script>

import {ElMessage, ElNotification} from "element-plus";
import {Server,Client} from "@/frontEnd/v4/common/webrtc";
import {Rule} from "@/backend/v4/core/module/fileDiff/fileDiff";
import {nextTick, reactive} from "vue";
import {time} from "@/frontEnd/v4/util/util";
import {buildFileNode,format,clone} from "@/frontEnd/v4/common/files";
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
        transportDialog:true,
        type:true,
        registerRequest:{},
        server:{text:'',msg:[]},
        client1:{text:'',msg:[]},
        client2:{text:'',msg:[]},
        left:{
          setTree:'setLeftTree',
          //base:'D:/Test/base',
          base:'D:/Test/compared',
        },
        right:{
          setTree:'setRightTree',
          //base:'D:/Test/compared',
          base:'D:/Test/base',
          local:true,
          main:true
        },
        fileList:[]
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
            {base: 'D:/Test/base/b', relative: 'a.bmp', target: 'D:/Test/compared/x.txt', mode: 'mapping'},
            //{base: 'D:/Test/compared/d.txt', relative: '', mode: 'incrementUpdate',dispatch:Rule.DISPATCH_TARGET},
            {base: 'D:/Test/base/a/a.txt', relative: '', mode: 'increment'},

            //{base: 'D:/Test/base/a.zip', relative:'a/b.zip/b',  mode: 'increment', through:true,pruning: true},
            {base: 'D:/Test/base/a.zip/a/b.zip', relative:'b',  mode: 'increment', through:true,pruning: true},

            //{base: 'D:/Test/base/a.zip/a/b.zip/k.zip', relative:'',  mode: 'cover',through:true},
            //{base: 'D:/Test/base/a.zip/a/b.zip/k.zip', relative:'k',  mode: 'incrementUpdate',through:true},
            {base: 'D:/Test/base/a.zip/a/b.zip', relative:'b/d',  mode: 'cover',through:true},
            {base: 'D:/Test/base/a.zip/a/b.zip', relative:'b/h',  mode: 'increment',through:true},


            {base: 'D:/Test/base/a.zip', relative:'a',  mode: 'mapping', target:'D:/Test/compared/x.zip',through:true,zip:true,pruning: true,sub:true},
            {base: 'D:/Test/base/a.zip', relative:'a/b.zip/b',  mode: 'mapping', target:'D:/Test/compared/y.zip',through:true,zip:true,pruning: true,sub:true},
            {base: 'D:/Test/base/a.zip', relative: 'a', mode: 'mapping', target:'D:/Test/compared/azip',through:true},
            {base: 'D:/Test/compared/azip', relative: '', mode: 'incrementUpdate', through:true,dispatch:Rule.DISPATCH_TARGET},

            {base: 'D:/Test/base/c.txt', relative: '', mode: 'update'},
            {base: 'D:/Test/base/b/bb', relative: '', mode: 'cover'},
            {base: 'D:/Test/base/b/a.bmp', relative: '', mode: 'cover'},
            {base: 'D:/Test/base/b/bb/b.bmp', target: 'D:/Test/compared/b/bb/x.bmp', mode: 'mapping'},
            //{base: 'D:/Test/base/b/bb/x/g (1).bmp',  mode: 'increment'},
            {base: 'D:/Test/base/c', relative: '',target: 'D:/Test/compared/从', mode: 'mapping',pruning:true},
            {base: 'D:/Test/compared/从', relative: '', mode: 'cover',dispatch:Rule.DISPATCH_TARGET},
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
    },clone(this.conf.server.ws)));
    this.localClient=this.client1=reactive(new Client('client1',{
      onChannelMsg:(data,msg)=>this.data.client1.msg.push({data,msgType:'rtc',time:time(),from:this.client1.remoteClientID}),
      onWsMsg:(content)=>this.data.client1.msg.push({...content,msgType:'ws '}),//({data})=>ElNotification({title:'ws客户端1收到消息',message:data.text}),
      onWsMsgSend:(content)=>this.isMsg(content)&&this.data.client1.msg.push({...content,msgType:'ws'}),
    },clone(this.conf.client1)));
    this.client2=reactive(new Client('client2',{
      onChannelMsg:(data,msg)=>this.data.client2.msg.push({data,msgType:'rtc',time:time(),from:this.client2.remoteClientID}),
      onWsMsg:(content)=>this.data.client2.msg.push({...content,msgType:'ws '}),//({data})=>ElNotification({title:'ws客户端2收到消息',message:data.text}),
      onWsMsgSend:(content)=>this.isMsg(content)&&this.data.client2.msg.push({...content,msgType:'ws'}),
    },clone(this.conf.client2)));
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
        this.browser(this.data.left.main?this.data.left:this.data.right);
      }
    },2000);
    setTimeout(()=>{
      if(this.localClient.states.channel==='OPEN') {
        this.browser(this.data.left.main?this.data.right:this.data.left);
      }
    },3000);

    let onAction=(removeListener=true)=>(...arg)=>{
      this.data.registerRequest[arg[0].requestId]?.(...arg);
      if(removeListener)delete this.data.registerRequest[arg[0].requestId];     //,一次性请求 销毁
    }
    window.files.onFileStructReply(this.localClient.name,onAction(true));
    window.files.onAuditingSyncFileReceive(this.localClient.name,onAction(true));
    window.files.onSendComplete(this.localClient.name,onAction(false));
    this.syncFileListInit();

  },
  methods:{
    clone,
    async test(){
      /*window.files.onFileStructReply('client1',(struct)=>{
        console.log(struct);
      });
      await window.files.remoteDir(this.client1.name,{base:'D:/'});*/
      window.files.syncFileList(this.localClient.name,{configs:clone(this.rules.upload),requestId:uuidv4()});
    },
    isMsg(content){
      return content.data.type==='ws-msg'||content.data.type==='ws-msg-transfer'
    },

    //.发送文件
    async sendFile(item){
      let requestId=uuidv4();
      item.percent=0;
      this.data.registerRequest[requestId]=({state,fileItem,id,requestId})=>{//,远程文件已接收反馈
        item.percent=state==='finish'?100:parseFloat((fileItem.offset*100/fileItem.size).toFixed(2));
        if(state==='finish'){
          delete this.data.registerRequest[requestId];
        }
        /*console.log(state);
        console.log(fileItem);
        console.log(id);
        console.log(requestId);*/
      };
      await this.$nextTick(()=>{});
      window.files.send(this.localClient.name,{fileItem:clone(item),requestId});
    },

    //. 初始化传输清单
    async syncFileListInit(){
      let id=uuidv4();
      this.data.registerRequest[id]=({list, forest, requestId,uploads})=>{
        console.log(list);
        console.log(forest);
        console.log(requestId);
        console.log(uploads);
        this.data.fileList=uploads;
      };
      window.files.syncFileList(this.localClient.name,{configs:clone(this.rules.upload),requestId:id});
    },

     //. 重置根节点
     async browser({base,local,setTree,main}){
        if (local) {
          let struct = await this.localFile(base);
          this.$refs.fileDiff[setTree](buildFileNode(struct), format(base), main);
        } else {
          this.remoteFile(base, ({struct}) => {
            this.$refs.fileDiff[setTree](buildFileNode(struct), format(base), main);
          });
        }
    },

    //. 加载子节点
    load(side){
      return async (node,resolve)=>{
        if (node.level === 0) {
          return;//resolve([{ name: 'root' }])
        }
        if(this.data[side].local){
          let struct=await this.localFile(node.data.path);
          resolve(buildFileNode(struct));
        }else{
          this.remoteFile(node.data.path,({struct})=>{
            resolve(buildFileNode(struct));
          });
        }
      };
    },
    
    //. 本地文件结构
    async localFile(base){
      return await window.files.dir({base});
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
<style scoped>
  .file-item{
    //border-bottom: 1px salmon solid;
    padding: 10px 8px;
    position: relative;
  }
  .file-item::before{
    content: ' ';
    display: inline-block;
    background-color: #b6ffc7;
    width: 4px;
    height: 85%;
    position: absolute;
    top: 7%;
  }
  .file-item-content{
    padding-left: 8px;
  }
  .file-item-source{
    width: 100%;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
  .file-item-action{
    justify-content: center;
    align-items: center;
    display: flex;
  }
</style>
<style>
.el-progress-bar__innerText{
  font-size: 10px !important;
  margin-bottom: 1px !important;
}

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
.transport{
  cursor: pointer;background-color: #409EFF;border-radius: 100px
}
</style>