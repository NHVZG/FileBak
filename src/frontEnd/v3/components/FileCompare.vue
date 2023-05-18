<template>
  <el-row :gutter="6">
    <el-col :span="11">
      <el-card shadow="always" class="tree-card left-scroll" ref="leftCard">
<!--        <el-tree :props="treePropName" :data="tree" :load="load" lazy>
          <template #default="{ node, data }">
            <div class="custom-tree-node">
              <span>

                <el-text v-if="data.display">
                    <el-icon v-if="data.type===0"><MessageBox /></el-icon>
                    <el-icon v-if="data.type===1" color="#c89065">
                        <Folder v-if="!node.expanded"/>
                        <FolderOpened v-if="node.expanded"/>
                    </el-icon>
                    <el-icon v-if="data.type===2" color="#689e82"><Files /></el-icon>
                    <el-icon v-if="data.type===3"><Link /></el-icon>
                  </el-text>

                <span class="node-text" :title="node.label">
                  <span>{{ node.label }}</span>
                </span>

                <span style="float: right">
                  <el-link  type="primary"  :underline="false" @click="chooseLeft($event,data,node)" :disabled="left.choose&&left.choosePath!==data.path">
                    {{left.choose?
                        left.choosePath===data.path?'取消':''
                        :
                        '选中'
                    }}
                  </el-link>
                </span>
              </span>
            </div>
          </template>
        </el-tree>-->
        <el-tree :props="treePropName" :data="leftTree" default-expand-all class="right-scroll">
          <template #default="{ node, data }">
            <div class="custom-tree-node" :ref="registerRef(node,data)">
              <span>

                <el-text v-if="data.display">
                    <el-icon v-if="data.type===0"><MessageBox /></el-icon>
                    <el-icon v-if="data.type===1" color="#c89065">
                        <Folder v-if="!node.expanded"/>
                        <FolderOpened v-if="node.expanded"/>
                    </el-icon>
                    <el-icon v-if="data.type===2" color="#689e82"><Files /></el-icon>
                    <el-icon v-if="data.type===3"><Link /></el-icon>
                  </el-text>

                <span class="node-text" :title="node.label">
                  <span>{{ node.label }}</span>
                </span>

                <span style="float: right">
                  <el-link  type="primary"  :underline="false" @click="chooseLeft($event,data,node)" :disabled="left.choose&&left.choosePath!==data.path">
                    {{left.choose?
                      left.choosePath===data.path?'取消':''
                      :
                      '选中'
                    }}
                  </el-link>
                </span>
              </span>
            </div>
          </template>
        </el-tree>

      </el-card>
      <el-text>{{left.choosePath}}</el-text>
    </el-col>
  <el-col :span="2">

    <div style="height: 400px;">
        <canvas style="height: 100%;width: 100%" ref="canvas"></canvas>
    </div>
  </el-col>

    <el-col :span="11">
        <el-card shadow="always" class="tree-card">
<!--          <el-tree :props="treePropName" :data="tree" :load="load" lazy>
            <template #default="{ node, data }">
              <div class="custom-tree-node">
              <span>
                <el-text v-if="data.display">
                    <el-icon v-if="data.type===0"><MessageBox /></el-icon>
                    <el-icon v-if="data.type===1" color="#c89065">
                        <Folder v-if="!node.expanded"/>
                        <FolderOpened v-if="node.expanded"/>
                    </el-icon>
                    <el-icon v-if="data.type===2" color="#689e82"><Files /></el-icon>
                    <el-icon v-if="data.type===3"><Link /></el-icon>
                  </el-text>

               <span class="node-text" :title="node.label">
                  <span>{{ node.label }}</span>
                </span>

                  <span style="float: right">
                    <el-link  type="primary"  :underline="false" @click="chooseRight($event,data,node)" :disabled="right.choose&&right.choosePath!==data.path">
                      {{right.choose?
                        right.choosePath===data.path?'取消':''
                        :
                        '选中'
                      }}
                    </el-link>
                  </span>
              </span>
              </div>
            </template>
          </el-tree>-->

          <el-tree :props="treePropName" :data="rightTree" default-expand-all>
            <template #default="{ node, data }">
              <div class="custom-tree-node">
              <span>
                <el-text v-if="data.display">
                    <el-icon v-if="data.type===0"><MessageBox /></el-icon>
                    <el-icon v-if="data.type===1" color="#c89065">
                        <Folder v-if="!node.expanded"/>
                        <FolderOpened v-if="node.expanded"/>
                    </el-icon>
                    <el-icon v-if="data.type===2" color="#689e82"><Files /></el-icon>
                    <el-icon v-if="data.type===3"><Link /></el-icon>
                  </el-text>

               <span class="node-text" :title="node.label">
                  <span>{{ node.label }}</span>
                </span>

                  <span style="float: right">
                    <el-link  type="primary"  :underline="false" @click="chooseRight($event,data,node)" :disabled="right.choose&&right.choosePath!==data.path">
                      {{right.choose?
                        right.choosePath===data.path?'取消':''
                        :
                        '选中'
                      }}
                    </el-link>
                  </span>
              </span>
              </div>
            </template>
          </el-tree>

        </el-card>
      <el-text>{{right.choosePath}}</el-text>
      </el-col>
  </el-row>
<el-button @click="colors">colors</el-button>
<el-button @click="leftTreeEl">leftTree</el-button>
<el-button @click="draw">draw</el-button>

  <canvas style="height: 100%;width: 100%" ref="canvas1"></canvas>
</template>

<script>
import {Link,Files, Folder, FolderOpened, MessageBox} from "@element-plus/icons-vue";
import {detailedDiff} from "deep-object-diff";

const DRIVER=0;                 //' 驱动器
const DIRECTORY=1;          //' 文件夹
const FILE=2;                       //' 文件
const SYMBOL=3;               //' 软连接

export default {
  name: "FileCompare",
  components: {Files, Folder, FolderOpened, MessageBox,Link},
  data(){
    return {
      base: '',//D:/Note
      tree:[],
      leftTree:[
        {"type":0,"name":"C","label":"C","path":"C:/","display":true,"leaf":false},
        {"type":0,"name":"D","label":"D","path":"D:/","display":true,"leaf":false,
          children: [{"type":1,"name":"$RECYCLE.BIN","label":"$RECYCLE.BIN","path":"D://$RECYCLE.BIN","display":true,"leaf":false},{"type":1,"name":".temp","label":".temp","path":"D://.temp","display":true,"leaf":false},
            {"type":1,"name":"Coding","label":"Coding","path":"D://Coding","display":true,"leaf":false,children: [{"type":1,"name":".config","label":".config","path":"D:/Coding/.config","display":true,"leaf":false},{"type":1,"name":"Project","label":"Project","path":"D:/Coding/Project","display":true,"leaf":false},{"type":1,"name":"Refer","label":"Refer","path":"D:/Coding/Refer","display":true,"leaf":false}]},
            {"type":1,"name":"Game","label":"Game","path":"D://Game","display":true,"leaf":false},{"type":1,"name":"Home","label":"Home","path":"D://Home","display":true,"leaf":false},{"type":1,"name":"Note","label":"Note","path":"D://Note","display":true,"leaf":false},{"type":1,"name":"Software","label":"Software","path":"D://Software","display":true,"leaf":false},
            {"type":1,"name":"Test","label":"Test","path":"D://Test","display":true,"leaf":false,children:[{"type":1,"name":".config","label":".config","path":"D:/Test/.config","display":true,"leaf":false},{"type":1,"name":"a","label":"a","path":"D:/Test/a","display":true,"leaf":false},{"type":1,"name":"Refer","label":"Refer","path":"D:/Test/Refer","display":true,"leaf":false}]},
            {"type":1,"name":"备份","label":"备份","path":"D://备份","display":true,"leaf":false},{"type":2,"name":"httpsbm.ruankao.org.cnsignup.txt","label":"httpsbm.ruankao.org.cnsignup.txt","path":"D://httpsbm.ruankao.org.cnsignup.txt","display":true,"leaf":true},{"type":2,"name":"Screenshot_20230201214717.jpg","label":"Screenshot_20230201214717.jpg","path":"D://Screenshot_20230201214717.jpg","display":true,"leaf":true},{"type":2,"name":"Screenshot_20230201214726.jpg","label":"Screenshot_20230201214726.jpg","path":"D://Screenshot_20230201214726.jpg","display":true,"leaf":true},{"type":2,"name":"微信图片_20220903142927.jpg","label":"微信图片_20220903142927.jpg","path":"D://微信图片_20220903142927.jpg","display":true,"leaf":true},
            {"type":2,"name":"报名照片.jpg","label":"报名照片.jpg","path":"D://报名照片.jpg","display":true,"leaf":true},
            {"type":2,"name":"1.jpg","label":"1.jpg","path":"D://1.jpg","display":true,"leaf":true},
            {"type":2,"name":"2.jpg","label":"2.jpg","path":"D://2.jpg","display":true,"leaf":true},
            {"type":2,"name":"3.jpg","label":"3.jpg","path":"D://3.jpg","display":true,"leaf":true},
            {"type":2,"name":"4.jpg","label":"4.jpg","path":"D://4.jpg","display":true,"leaf":true},
            {"type":2,"name":"5.jpg","label":"5.jpg","path":"D://5.jpg","display":true,"leaf":true},
            {"type":2,"name":"6.jpg","label":"6.jpg","path":"D://6.jpg","display":true,"leaf":true}
          ]
        }],
      rightTree:[
          {"type":0,"name":"C","label":"C","path":"C:/","display":true,"leaf":false},
          {"type":0,"name":"D","label":"D","path":"D:/","display":true,"leaf":false,
            children: [{"type":1,"name":"$RECYCLE.BIN","label":"$RECYCLE.BIN","path":"D://$RECYCLE.BIN","display":true,"leaf":false},{"type":1,"name":".temp","label":".temp","path":"D://.temp","display":true,"leaf":false},
              {"type":1,"name":"Coding","label":"Coding","path":"D://Coding","display":true,"leaf":false,children: [{"type":1,"name":".config","label":".config","path":"D:/Coding/.config","display":true,"leaf":false},{"type":1,"name":"Project","label":"Project","path":"D:/Coding/Project","display":true,"leaf":false},{"type":1,"name":"Refer","label":"Refer","path":"D:/Coding/Refer","display":true,"leaf":false}]},
              {"type":1,"name":"Game","label":"Game","path":"D://Game","display":true,"leaf":false},{"type":1,"name":"Home","label":"Home","path":"D://Home","display":true,"leaf":false},{"type":1,"name":"Note","label":"Note","path":"D://Note","display":true,"leaf":false},{"type":1,"name":"Software","label":"Software","path":"D://Software","display":true,"leaf":false},
              {"type":1,"name":"Test","label":"Test","path":"D://Test","display":true,"leaf":false,children:[{"type":1,"name":".config","label":".config","path":"D:/Test/.config","display":true,"leaf":false},{"type":1,"name":"a","label":"a","path":"D:/Test/a","display":true,"leaf":false},{"type":1,"name":"Refer","label":"Refer","path":"D:/Test/Refer","display":true,"leaf":false}]},
              {"type":1,"name":"备份","label":"备份","path":"D://备份","display":true,"leaf":false},{"type":2,"name":"httpsbm.ruankao.org.cnsignup.txt","label":"httpsbm.ruankao.org.cnsignup.txt","path":"D://httpsbm.ruankao.org.cnsignup.txt","display":true,"leaf":true},{"type":2,"name":"Screenshot_20230201214717.jpg","label":"Screenshot_20230201214717.jpg","path":"D://Screenshot_20230201214717.jpg","display":true,"leaf":true},{"type":2,"name":"Screenshot_20230201214726.jpg","label":"Screenshot_20230201214726.jpg","path":"D://Screenshot_20230201214726.jpg","display":true,"leaf":true},{"type":2,"name":"微信图片_20220903142927.jpg","label":"微信图片_20220903142927.jpg","path":"D://微信图片_20220903142927.jpg","display":true,"leaf":true},
              {"type":2,"name":"报名照片.jpg","label":"报名照片.jpg","path":"D://报名照片.jpg","display":true,"leaf":true},
              {"type":2,"name":"1.jpg","label":"1.jpg","path":"D://k.jpg","display":true,"leaf":true}
            ]
          }],
      remoteTree:[],
      remoteResolve:null,
      treePropName:{
        label: 'name',                //. label读 name字段
        isLeaf: 'leaf',                 //. 是否叶子读leaf字段
        children: 'children',
      },
      left:{
        choose:true,
        choosePath:'D://Coding',
        base:''

      },
      right:{
        choose:true,
        choosePath:'D://Test',
        base:''
      }

    }
  },
  mounted() {
    //console.log('mounted');
    //this.read();
    let _this=this;
    /*window.files.onFileStructReply(function(struct){
      _this.remoteResolve(_this.resolveNode(struct));
    });*/
    this.compareTree();
  },
  methods:{
    async load(node,resolve){
      if(node.level===0){
        let struct=await window.files.dir(this.base);
        this.tree=this.resolveNode(struct);
      }else{
        let struct=await window.files.dir(node.data.path);
        resolve(this.resolveNode(struct));
      }
    },
    loadRemote(node,resolve){
      if(node.level===0) {
        //window.testWebrtc.channelSend('client2', {type: 'file-struct-request', data: {base:''}});
      }else{
        window.testWebrtc.channelSend('client2', {type: 'file-struct-request', data: {base:node.data.path}});
      }
      this.remoteResolve=resolve;
    },
    resolveNode(struct){
      return struct.map(file=>({
        type:file.type,
        name:file.name,
        label:file.name,
        path:file.path,
        display:true,
        leaf:[FILE,SYMBOL].includes(file.type)
      }));
    },
    getRemoteFileStruct(){
      window.testWebrtc.channelSend('client2',{type:'file-struct-request',data:{base:''}});
    },
    chooseLeft(event,data,node){
      event.stopPropagation();
      if(this.left.choose&&this.left.choosePath!==data.path)return;

      if(!this.left.choose){
        this.left.choose=true;
        this.left.choosePath=data.path;
      }else{
        this.left.choose=false;
        this.left.choosePath='';
      }
      if([FILE,SYMBOL].includes(data.type))return;
      node.expand();
      //node.expanded=true;
    },
    chooseRight(event,data,node){
      event.stopPropagation();
      if(this.right.choose&&this.right.choosePath!==data.path)return;

      if(!this.right.choose){
        this.right.choose=true;
        this.right.choosePath=data.path;
      }else{
        this.right.choose=false;
        this.right.choosePath='';
      }
      if([FILE,SYMBOL].includes(data.type))return;
      node.expand();
      //node.expanded=true;
    },

    registerRef(node, data) {
       data.id = node.id;
      return `node_${node.id}`;
    },

    compareTree() {
      console.log(detailedDiff(this.leftTree,this.rightTree));
    },

    colors(){
      let row=this.$refs['node_'+this.leftTree[0].id].parentElement.parentElement;
      console.log(row);
      row.style.backgroundColor='red';//inherit
    },
    leftTreeEl(){
      console.log(this.$refs.leftCard.$el.scrollHeight);
      console.log(this.$refs.leftCard.$el.clientHeight);
    },
    draw(){
      let canvas=this.$refs.canvas;
      let parent=canvas.parentElement;
      canvas.width=parent.clientWidth;
      canvas.height=parent.clientHeight;
      let ctx=canvas.getContext('2d');
      ctx.lineWidth=1;
      ctx.strokeStyle='#a5f77f63';
      ctx.fillStyle='#a5f77f63';
      ctx.beginPath();
      let begin={x:0,y:0};
      let end={x:parent.clientWidth,y:50};
      let radius=40;
      ctx.moveTo(begin.x, begin.y);
      ctx.bezierCurveTo(begin.x+radius,begin.y,end.x-radius,end.y,end.x,end.y);
      ctx.lineTo(0,end.y);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      this.$refs[`node_${this.leftTree[0].id}`].parentElement.style.backgroundColor='#a5f77f63';
      this.$refs[`node_${this.leftTree[1].id}`].parentElement.style.backgroundColor='#a5f77f63';
    }


  }
}
</script>

<style scoped>
.tree-card{
  height: 400px;
  overflow-y: auto;
  overflow-x: auto;
}
.custom-tree-node{
  width: 100%;
  text-align: left;
  /*padding: 4px;*/
}
.custom-tree-node {

 /* background-color: #e6f0e6;*/
}

.node-text{
  display: inline-flex;
  max-width:160px;
}
.node-text>span{
  display:inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
}
.left-scroll{
  direction: rtl;
}
.right-scroll{
  direction: ltr;
}
</style>

<!--全局-->
<style>
  /*.el-tree-node__content{
    height: auto;
  }
  .el-tree-node__content>.el-tree-node__expand-icon{
    padding: 0;
  }*/

 /*
 .el-tree-node__content + .el-tree-node__children{
  background-color: red;
}
 .el-tree-node__content:hover {
   background-color:inherit;
 }
 .el-tree-node:focus>.el-tree-node__content {
   background-color: inherit;
 }*/
</style>