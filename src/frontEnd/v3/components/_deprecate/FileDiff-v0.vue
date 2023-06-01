<template>
  <el-row>
    <el-col :span="11">
      <div class="box left-scroll" :style="`height:${boxHeight}px`" @scroll="onLeftBoxScroll" ref="leftTreeBox">
        <el-tree :props="treePropName" :data="leftTree" ref="leftTree" default-expand-all>
          <template #default="{ node, data }">

            <div class="diff-node" :ref="registerRef(node,data)" :data-node-id="`${node.id}`" :data-node-level="`${node.level}`" :id="`node_${node.id}`">
              <span>
                <el-text v-if="data.display">
                    <el-icon v-if="data.type===0"><MessageBox /></el-icon>
                    <el-icon v-if="data.type===1&&!node.expanded" color="#c89065"><Folder/></el-icon>
                    <el-icon v-if="data.type===1&&node.expanded" color="#c89065"><FolderOpened/></el-icon>
                    <el-icon v-if="data.type===2" color="#689e82"><Files /></el-icon>
                    <el-icon v-if="data.type===3"><Link /></el-icon>
                </el-text>
                <span class="node-text" :title="node.label"><span>{{node.id}}-{{ node.label }}</span></span>
                <span style="float: right">
                  <el-link  type="primary"  :underline="false" @click="chooseLeft($event,data,node)" :disabled="left.choose&&left.choosePath!==data.path">
                    {{left.choose?left.choosePath===data.path?'取消':'':'选中'}}
                  </el-link>
                </span>
              </span>
            </div>

          </template>
        </el-tree>
      </div>
    </el-col>

    <el-col :span="2">
      <div style="height: 400px;">
        <canvas style="height: 100%;width: 100%" ref="canvas"></canvas>
      </div>
    </el-col>

    <el-col :span="11">
      <div class="box" :style="`height:${boxHeight}px`" @scroll="onRightBoxScroll" ref="rightTreeBox">
        <el-tree :props="treePropName" :data="rightTree" ref="rightTree" default-expand-all>
          <template #default="{ node, data }">

            <div class="diff-node" :ref="registerRef(node,data)" :data-node-id="`${node.id}`" :data-node-level="`${node.level}`" :id="`node_${node.id}`">
              <span>
                <el-text v-if="data.display">
                    <el-icon v-if="data.type===0"><MessageBox /></el-icon>
                    <el-icon v-if="data.type===1&&!node.expanded" color="#c89065"><Folder/></el-icon>
                    <el-icon v-if="data.type===1&&node.expanded" color="#c89065"><FolderOpened/></el-icon>
                    <el-icon v-if="data.type===2" color="#689e82"><Files /></el-icon>
                    <el-icon v-if="data.type===3"><Link /></el-icon>
                </el-text>
                <span class="node-text" :title="node.label"><span>{{node.id}}-{{ node.label }}</span></span>
                <span style="float: right">
                  <el-link  type="primary"  :underline="false" @click="chooseLeft($event,data,node)" :disabled="right.choose&&right.choosePath!==data.path">
                    {{right.choose?right.choosePath===data.path?'取消':'':'选中'}}
                  </el-link>
                </span>
              </span>
            </div>

          </template>
        </el-tree>
      </div>
    </el-col>

  </el-row>
  <el-button @click="colors">colors</el-button>
  <el-button @click="leftTreeEl">leftTree</el-button>
  <el-button @click="draw">draw</el-button>
  <el-button @click="getRef">getRef</el-button>

</template>

<script>
import {Link,Files, Folder, FolderOpened, MessageBox} from "@element-plus/icons-vue";
import {detailedDiff} from "deep-object-diff";
import $ from "jquery";
import {list2map,recursiveTree} from "@/frontEnd/v3/components/common/util";

const DRIVER=0;                 //' 驱动器
const DIRECTORY=1;          //' 文件夹
const FILE=2;                       //' 文件
const SYMBOL=3;               //' 软连接

export default {
  name: "FileDiff",
  components: {Files, Folder, FolderOpened, MessageBox,Link},
  data(){
    return {
      boxHeight:400,
      treeItemHeight:26,
      viewPortNodes:null,   //视窗可见节点数+2
      testcolor:'green',


      base: '',//D:/Note
      tree:[],
      leftTree:[
        {"type":0,"name":"C","label":"C","path":"C:/","display":true,"leaf":false,id:'abc'},
        {"type":0,"name":"D","label":"D","path":"D:/","display":true,"leaf":false,
          children: [{"type":1,"name":"$RECYCLE.BIN","label":"$RECYCLE.BIN","path":"D://$RECYCLE.BIN","display":true,"leaf":false},{"type":1,"name":".temp","label":".temp","path":"D://.temp","display":true,"leaf":false,children:[{"type":1,"name":"t1","label":"t1","path":"D://.temp/t1","display":true,"leaf":false}]},
            {"type":2,"name":"1.jpg","label":"1.jpg","path":"D://1.jpg","display":true,"leaf":true},
            {"type":1,"name":"Coding","label":"Coding","path":"D://Coding","display":true,"leaf":false,children: [{"type":1,"name":"Project","label":"Project","path":"D:/Coding/Project","display":true,"leaf":false},{"type":1,"name":"Refer","label":"Refer","path":"D:/Coding/Refer","display":true,"leaf":false,children:[{"type":1,"name":"v","label":"v","path":"D://Coding/Refer/v","display":true,"leaf":false}]},
                {"type":1,"name":".config","label":".config","path":"D:/Coding/.config","display":true,"leaf":false,children:[
                    {"type":2,"name":"abc.jpg","label":"abc.jpg","path":"D:/Coding/.config/abc.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc1.jpg","label":"abc1.jpg","path":"D:/Coding/.config/abc1.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc2.jpg","label":"abc2.jpg","path":"D:/Coding/.config/abc2.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc3.jpg","label":"abc3.jpg","path":"D:/Coding/.config/abc3.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc4.jpg","label":"abc4.jpg","path":"D:/Coding/.config/abc4.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc5.jpg","label":"abc5.jpg","path":"D:/Coding/.config/abc5.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc6.jpg","label":"abc6.jpg","path":"D:/Coding/.config/abc6.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc7.jpg","label":"abc7.jpg","path":"D:/Coding/.config/abc7.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc8.jpg","label":"abc8.jpg","path":"D:/Coding/.config/abc8.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc9.jpg","label":"abc9.jpg","path":"D:/Coding/.config/abc9.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc10.jpg","label":"abc10.jpg","path":"D:/Coding/.config/abc10.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc11.jpg","label":"abc11.jpg","path":"D:/Coding/.config/abc11.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc12.jpg","label":"abc12.jpg","path":"D:/Coding/.config/abc12.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc13.jpg","label":"abc13.jpg","path":"D:/Coding/.config/abc13.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc14.jpg","label":"abc14.jpg","path":"D:/Coding/.config/abc14.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc15.jpg","label":"abc15.jpg","path":"D:/Coding/.config/abc15.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc16.jpg","label":"abc16.jpg","path":"D:/Coding/.config/abc16.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc17.jpg","label":"abc17.jpg","path":"D:/Coding/.config/abc17.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc18.jpg","label":"abc18.jpg","path":"D:/Coding/.config/abc18.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc19.jpg","label":"abc19.jpg","path":"D:/Coding/.config/abc19.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc20.jpg","label":"abc20.jpg","path":"D:/Coding/.config/abc20.jpg","display":true,"leaf":true},
                    {"type":2,"name":"abc21.jpg","label":"abc21.jpg","path":"D:/Coding/.config/abc21.jpg","display":true,"leaf":true},
                  ]},
                {"type":1,"name":".config2","label":".config2","path":"D:/Coding/.config2","display":true,"leaf":false}
              ]},
            {"type":1,"name":"Game","label":"Game","path":"D://Game","display":true,"leaf":false},{"type":1,"name":"Home","label":"Home","path":"D://Home","display":true,"leaf":false},{"type":1,"name":"Note","label":"Note","path":"D://Note","display":true,"leaf":false},{"type":1,"name":"Software","label":"Software","path":"D://Software","display":true,"leaf":false},
            //{"type":1,"name":"Test","label":"Test","path":"D://Test","display":true,"leaf":false,children:[{"type":1,"name":".config","label":".config","path":"D:/Test/.config","display":true,"leaf":false},{"type":1,"name":"a","label":"a","path":"D:/Test/a","display":true,"leaf":false},{"type":1,"name":"Refer","label":"Refer","path":"D:/Test/Refer","display":true,"leaf":false}]},
            {"type":1,"name":"备份","label":"备份","path":"D://备份","display":true,"leaf":false},{"type":2,"name":"httpsbm.ruankao.org.cnsignup.txt","label":"httpsbm.ruankao.org.cnsignup.txt","path":"D://httpsbm.ruankao.org.cnsignup.txt","display":true,"leaf":true},{"type":2,"name":"Screenshot_20230201214717.jpg","label":"Screenshot_20230201214717.jpg","path":"D://Screenshot_20230201214717.jpg","display":true,"leaf":true},{"type":2,"name":"Screenshot_20230201214726.jpg","label":"Screenshot_20230201214726.jpg","path":"D://Screenshot_20230201214726.jpg","display":true,"leaf":true},{"type":2,"name":"微信图片_20220903142927.jpg","label":"微信图片_20220903142927.jpg","path":"D://微信图片_20220903142927.jpg","display":true,"leaf":true},
            {"type":2,"name":"报名照片.jpg","label":"报名照片.jpg","path":"D://报名照片.jpg","display":true,"leaf":true},
            {"type":2,"name":"2.jpg","label":"2.jpg","path":"D://2.jpg","display":true,"leaf":true},
            {"type":2,"name":"3.jpg","label":"3.jpg","path":"D://3.jpg","display":true,"leaf":true},
            {"type":2,"name":"4.jpg","label":"4.jpg","path":"D://4.jpg","display":true,"leaf":true},
            {"type":2,"name":"5.jpg","label":"5.jpg","path":"D://5.jpg","display":true,"leaf":true},
            {"type":2,"name":"6.jpg","label":"6.jpg","path":"D://6.jpg","display":true,"leaf":true}
          ]
        }],
      rightTree:[
        {"type":0,"name":"C","label":"C","path":"C:/","display":true,"leaf":false},
        {"type":0,"name":"D","label":"D","path":"D:/","display":true,"leaf":false,expanded:true,
          children: [{"type":1,"name":"$RECYCLE.BIN","label":"$RECYCLE.BIN","path":"D://$RECYCLE.BIN","display":true,"leaf":false},{"type":1,"name":".temp","label":".temp","path":"D://.temp","display":true,"leaf":false,children:[{"type":1,"name":"t1","label":"t1","path":"D://.temp/t1","display":true,"leaf":false,children:[{"type":1,"name":"t11","label":"t11","path":"D://.temp/t1/t11","display":true,"leaf":true},]}]},
            {"type":1,"name":"Coding","label":"Coding","path":"D://Coding","display":true,"leaf":false,children: [{"type":1,"name":".config","label":".config","path":"D:/Coding/.config","display":true,"leaf":false},{"type":1,"name":"Project","label":"Project","path":"D:/Coding/Project","display":true,"leaf":false},{"type":1,"name":"Refer","label":"Refer","path":"D:/Coding/Refer","display":true,"leaf":false,children:[{"type":1,"name":"v","label":"v","path":"D://Coding/Refer/v","display":true,"leaf":false,children:[{"type":1,"name":"f","label":"f","path":"D://Coding/Refer/v/f","display":true,"leaf":true}]},{"type":1,"name":"t","label":"t","path":"D://Coding/Refer/t","display":true,"leaf":true}]}]},
            {"type":1,"name":"备份1","label":"备份1","path":"D://备份1","display":true,"leaf":false},
            {"type":1,"name":"Game","label":"Game","path":"D://Game","display":true,"leaf":false},{"type":1,"name":"Home","label":"Home","path":"D://Home","display":true,"leaf":false},{"type":1,"name":"Note","label":"Note","path":"D://Note","display":true,"leaf":false},{"type":1,"name":"Software","label":"Software","path":"D://Software","display":true,"leaf":false},
            {"type":1,"name":"Test","label":"Test","path":"D://Test","display":true,"leaf":false,children:[{"type":1,"name":".config","label":".config","path":"D:/Test/.config","display":true,"leaf":false},{"type":1,"name":"a","label":"a","path":"D:/Test/a","display":true,"leaf":false},{"type":1,"name":"Refer","label":"Refer","path":"D:/Test/Refer","display":true,"leaf":false}]},
            {"type":1,"name":"备份","label":"备份","path":"D://备份","display":true,"leaf":false},{"type":2,"name":"httpsbm.ruankao.org.cnsignup.txt","label":"httpsbm.ruankao.org.cnsignup.txt","path":"D://httpsbm.ruankao.org.cnsignup.txt","display":true,"leaf":true},{"type":2,"name":"Screenshot_20230201214717.jpg","label":"Screenshot_20230201214717.jpg","path":"D://Screenshot_20230201214717.jpg","display":true,"leaf":true},{"type":2,"name":"Screenshot_20230201214726.jpg","label":"Screenshot_20230201214726.jpg","path":"D://Screenshot_20230201214726.jpg","display":true,"leaf":true},{"type":2,"name":"微信图片_20220903142927.jpg","label":"微信图片_20220903142927.jpg","path":"D://微信图片_20220903142927.jpg","display":true,"leaf":true},
            {"type":2,"name":"报名照片.jpg","label":"报名照片.jpg","path":"D://报名照片.jpg","display":true,"leaf":true},
            {"type":2,"name":"k.jpg","label":"k.jpg","path":"D://k.jpg","display":true,"leaf":true}
          ]
        }],
      remoteTree:[],
      remoteResolve:null,


      treePropName:{
        label: 'name',                //. label读 name字段
        isLeaf: 'leaf',                 //. 是否叶子读leaf字段
        children: 'children',
        class:(data,node)=>data.class||''
      },
      diffs:{},
      left:{
        scrollTimer:null,
        scrolling:false,
        choose:true,
        choosePath:'D://Coding',
        base:'',
        treeRefs:null
      },
      right:{
        scrollTimer:null,
        scrolling:false,
        choose:true,
        choosePath:'D://Test',
        base:'',
        treeRefs:null
      },

      canvas:{
        width:0,
        height:0,
      },
      styles:{
        node:{

          add:'#a5f77f63',
          add1:'#6bf75063',
          removed:'#eab4c675',
          removed1:'rgba(226,122,148,0.46)',
          mergeRemoved:'red',
          edit:'rgba(217,217,217,0.49)',
          edit1:'rgba(180,180,180,0.49)',
          normal:'inherit'
        }
      }
    }
  },
  computed:{
    leftScroll(){
      return this.right.scrolling?null:this.onLeftBoxScroll
    },
    rightScroll(){
      return this.left.scrolling?null:this.onRightBoxScroll
    }

  },
  mounted() {
    console.log(this.$refs.leftTree);
    //console.log('mounted');
    //this.read();
    let _this=this;
    /*window.files.onFileStructReply(function(struct){
      _this.remoteResolve(_this.resolveNode(struct));
    });*/
    //this.compareTree();
    this.diffs=this.diff({id:0,children:this.leftTree},{id:0,children:this.rightTree},true,false);
    console.log(this.diffs);
    this.viewPortNodes=(this.boxHeight/this.treeItemHeight)+2;
  },
  methods:{
    //,render
    //.初始化节点数据
    registerRef(node, data) {
      data.id = node.id;
      data.pid=node.parent.id;
      data.level=node.level;
      return `node_${node.id}`;
    },


    async load(node,resolve){
      if(node.level===0){
        let struct=await window.files.dir(this.base);
        this.tree=this.resolveNode(struct);
      }else{
        let struct=await window.files.dir(node.data.path);
        resolve(this.resolveNode(struct));
      }
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
    loadRemote(node,resolve){
      if(node.level===0) {
        //window.testWebrtc.channelSend('client2', {type: 'file-struct-request', data: {base:''}});
      }else{
        window.testWebrtc.channelSend('client2', {type: 'file-struct-request', data: {base:node.data.path}});
      }
      this.remoteResolve=resolve;
    },
    getRemoteFileStruct(){
      window.testWebrtc.channelSend('client2',{type:'file-struct-request',data:{base:''}});
    },

    chooseLeft(event,data,node){
      console.log(node);
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


    buildMergeItem(type){
      switch (type){
        case 'add': return {left:{start:null,end:null,e:[]},right:{e:null,y:null}};
        case 'edit': return {left:{start:null,end:null,e:[]},right:{start:null,end:null,e:[]}};
        case 'removed': return {left:{e:null,y:null},right:{start:null,end:null,e:[]}};
      }
    },

    onLeftBoxScroll(){
      let {firstCommon}=this.drawDiffs();

      if(this.right.scrolling)return;
      this.left.scrolling=true;
      if(firstCommon.left.node){
        let node=this.$refs.leftTree.getNode(firstCommon.left.node.id);
        let common=this.diffs.common[node.data.path];
        let e=$(this.$refs.rightTree.$el).find(`[data-node-id=${common.r_id}]`)[0];
        this.$refs.rightTreeBox.scrollTo({top:e.offsetTop-firstCommon.left.node.y,behavior: 'smooth'});
        clearTimeout(this.left.scrollTimer);
        this.left.scrollTimer=()=>this.left.scrolling=false;
        setTimeout(this.left.scrollTimer,4000);
      }
    },
    onRightBoxScroll(){
      let {firstCommon}=this.drawDiffs();

      if(this.left.scrolling)return;
      this.right.scrolling=true;
      if(firstCommon.right.node){
        let node=this.$refs.rightTree.getNode(firstCommon.right.node.id);
        let common=this.diffs.common[node.data.path];
        let e=$(this.$refs.leftTree.$el).find(`[data-node-id=${common.l_id}]`)[0];
        this.$refs.leftTreeBox.scrollTo({top:e.offsetTop-firstCommon.right.node.y,behavior: 'smooth'});
        clearTimeout(this.right.scrollTimer);
        this.right.scrollTimer=()=>this.right.scrolling=false;
        setTimeout(this.right.scrollTimer,4000);
      }
    },


    drawDiffs(){
      let leftNodes=this.findBoxVisibleNode(this.$refs.leftTreeBox).map(n=>({...n,id:n.e.dataset.nodeId}));
      let rightNodes=this.findBoxVisibleNode(this.$refs.rightTreeBox).map(n=>({...n,id:n.e.dataset.nodeId}));   //{id,e,y}
      let leftMap=list2map(leftNodes,'id');                                                                                                                     //{[id]:{id,e,y}}
      let rightMap=list2map(rightNodes,'id');
      let changes={
        add:[],
        removed:[],
        edit:[]
      };

      let firstCommon={left:{node:null},right:{node:null}};

      let merge=null;
      let type,lastType;
      for(let leftNode of leftNodes){
        if(this.diffs.add[leftNode.id]){
          type='add';
        }else if(this.diffs.edit[leftNode.id]){
          type='edit';
        }else{//相同
          if(!firstCommon.left.node)firstCommon.left.node=leftNode;

          if(merge){
            changes[lastType].push(merge);
            lastType=null;
            merge=null;
          }
          continue;
        }

        if(lastType!==type){
          if(merge)changes[lastType].push(merge);
          lastType=type;
          merge=null;
        }
        if(!merge)merge=this.buildMergeItem(type);
        if(type==='add'){
          merge.left.e.push(leftNode.e);
          let diffItem=this.diffs.add[leftNode.id];
          let rightNode=rightMap[diffItem.r_pid]
          if(rightNode){
            if(merge.left.start==null)merge.left.start=leftNode.y;
            merge.left.end=(merge.left.end==null?leftNode.y:merge.left.end)+this.treeItemHeight;    //如果右边节点也在可视范围内再绘制
            if(merge.right.e==null)merge.right.e=rightNode.e;
            if(merge.right.y==null)merge.right.y=rightNode.y+this.treeItemHeight;
          }
        }else if(type==='edit'){
          merge.left.e.push(leftNode.e);
          let diffItem=this.diffs.edit[leftNode.id];
          let rightNode=rightMap[diffItem.r_pid]
          if(rightNode){
            merge.right.e.push(rightNode.e);
            if(merge.left.start==null)merge.left.start=leftNode.y;
            if(merge.right.start==null)merge.right.start=rightNode.y;
            merge.left.end=(merge.left.end==null?leftNode.y:merge.left.end)+this.treeItemHeight;
            merge.right.end=(merge.right.end==null?rightNode.y:merge.right.end)+this.treeItemHeight;
          }
        }
      }
      if(merge!=null){
        changes[type].push(merge);
        merge=null;
      }
      for(let rightNode of rightNodes){
        let diffItem=this.diffs.removed[rightNode.id];
        if(!diffItem){
          if(!firstCommon.right.node)firstCommon.right.node=rightNode;
          if(merge){//相同
            changes.removed.push(merge);
            merge=null;
          }
          continue;
        }
        if(!merge)merge=this.buildMergeItem('removed');
        merge.right.e.push(rightNode.e);
        let leftNode=leftMap[diffItem.l_pid];
        if(leftNode){
          if(merge.right.start==null)merge.right.start=rightNode.y;
          merge.right.end=(merge.right.end==null?rightNode.y:merge.right.end)+this.treeItemHeight;    //如果右边节点也在可视范围内再绘制
          if(merge.left.e==null)merge.left.e=leftNode.e;
          if(merge.left.y==null)merge.left.y=leftNode.y+this.treeItemHeight;
        }
      }
      if(merge!=null){
        changes.removed.push(merge);
      }


      let canvas=this.$refs.canvas;
      let ctx=canvas.getContext('2d');
      let parent=canvas.parentElement;
      canvas.width=parent.clientWidth;
      canvas.height=parent.clientHeight;
      ctx.clearRect(0, 0, parent.clientWidth, parent.clientHeight);
      ctx.lineWidth=1;
      let {add,edit,removed}=this.styles.node;
      let radius=35;
      ctx.strokeStyle=add;
      ctx.fillStyle=add;
      changes.add.map(c=>{
        c.left.e.map(e=>e.parentElement.style.backgroundColor=add);
        if(c.left.start==null||c.left.end==null||c.right.y==null)return;
        c.right.e.parentElement.style.borderBottom=`3px ${add} solid`;
        ctx.beginPath();
        let left1={x:0,y:c.left.start};
        let left2={x:0,y:c.left.end};
        let right1={x:parent.clientWidth,y:c.right.y};
        ctx.moveTo(left1.x, left1.y);

        ctx.bezierCurveTo(left1.x+radius,left1.y,right1.x-radius,right1.y,right1.x,right1.y-2);

        ctx.bezierCurveTo(right1.x-radius,right1.y,left2.x+radius+10,left2.y,left2.x,left2.y);


        ctx.closePath();
        ctx.stroke();
        ctx.fill();
      });

      ctx.strokeStyle=edit;
      ctx.fillStyle=edit;
      changes.edit.map(c=>{
        c.left.e.map(e=>e.parentElement.style.backgroundColor=edit);
        c.right.e.map(e=>e.parentElement.style.backgroundColor=edit);
        if(c.left.start==null||c.right.start==null||c.left.end==null||c.right.end==null)return;
        ctx.beginPath();
        let left1={x:0,y:c.left.start};
        let left2={x:0,y:c.left.end};
        let right1={x:parent.clientWidth,y:c.right.start};
        let right2={x:parent.clientWidth,y:c.right.end};
        ctx.moveTo(left1.x, left1.y);
        ctx.bezierCurveTo(left1.x+radius,left1.y,right1.x-radius,right1.y,right1.x,right1.y);
        ctx.lineTo(right2.x,right2.y);
        ctx.bezierCurveTo(right2.x-radius,right2.y,left2.x+radius,left2.y,left2.x,left2.y);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
      });

      ctx.strokeStyle=removed;
      ctx.fillStyle=removed;
      changes.removed.map(c=>{
        c.right.e.map(e=>e.parentElement.style.backgroundColor=removed);
        if(c.left.y==null||c.right.start==null||c.right.end==null)return;
        c.left.e.parentElement.style.borderBottom=`3px ${removed} solid`;
        ctx.beginPath();
        let left1={x:0,y:c.left.y};
        let right1={x:parent.clientWidth,y:c.right.start};
        let right2={x:parent.clientWidth,y:c.right.end};
        ctx.moveTo(left1.x, left1.y-2);
        ctx.bezierCurveTo(left1.x+radius,left1.y,right1.x-radius,right1.y,right1.x,right1.y);
        ctx.lineTo(right2.x,right2.y);
        ctx.bezierCurveTo(right2.x-radius-10,right2.y,left1.x+radius,left1.y,left1.x,left1.y);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
      });

      return {firstCommon};
    },
    findBoxVisibleNode(treeBoxRefs){         //, 获得滚动窗口可视节点(暂时显示全部）
      let start=Math.floor(treeBoxRefs.scrollTop/this.treeItemHeight)-1;       //可视起始项坐标
      start=start<0?0:start;
      let origin=start*this.treeItemHeight-treeBoxRefs.scrollTop;                         //绘图起始点作为绘图坐标原点y （滚动节点一半情况）
      return $(treeBoxRefs)
          .find(".diff-node:visible")
          .toArray()
          .splice(start,this.viewPortNodes)
          .map((n,idx)=>({
            e: n,                                                                   //起始y
            y: origin + this.treeItemHeight * idx,
            id: n.dataset.nodeId,
            level:parseInt(n.dataset.nodeLevel)
          }));
    },
    diff(leftNode, rightNode, deep = false,edit=true) {
      let diffs={
        add:{},                         //左边新增节点
        edit:{},                         //相同结构，子节点不同
        rightEdit:{},                 //右编辑节点
        removed:{},                 //右边新增节点
        common:{}
      };
      let createDiff=(l_id,r_id)=>({
        l_id,                             //左节点id
        r_id,                             //右节点id
        l_pid:leftNode.id,       //左父节点id
        r_pid:rightNode.id     //右父节点id
      });
      let change=false;
      let commons=[];
      let leftMap = list2map(leftNode.children,'path');
      let rightMap = list2map(rightNode.children,'path');
      for(let n of Object.keys(leftMap)){
        if(rightMap[n]&&deep){                                     //相同节点
          diffs.common[n]={l_id:leftMap[n].id,r_id:rightMap[n].id};
          commons.push({leftNode:leftMap[n],rightNode:rightMap[n]});
        }else{                                                                     //左边新增节点
          let left=leftMap[n];
          change=true;
          //diffs.add[left.id]=createDiff(left.id);
          recursiveTree(left,'children',(node)=>diffs.add[node.id]=createDiff(node.id));
        }
      }
      Object.keys(rightMap).map(n=>{                  //右边新增节点
        if(!leftMap[n]){
          let right=rightMap[n];
          change=true;
          //diffs.removed[right.id]=createDiff(null,right.id);
          recursiveTree(right,'children',(node)=>diffs.removed[node.id]=createDiff(node.id));
        }
      });
      if(deep){                                                                 //递归子节点
        commons.map(c=>{
          let subDiffs=this.diff(c.leftNode,c.rightNode,deep)
          if((subDiffs.add&&Object.keys(subDiffs.add).length>0)||
              (subDiffs.removed&&Object.keys(subDiffs.removed).length>0)||
              (subDiffs.edit&&Object.keys(subDiffs.edit).length>0))change=true;
          diffs.add={...diffs.add,...subDiffs.add};
          diffs.edit={...diffs.edit,...subDiffs.edit};
          diffs.rightEdit={...diffs.rightEdit,...subDiffs.rightEdit};
          diffs.removed={...diffs.removed,...subDiffs.removed};
          diffs.common={...diffs.common,...subDiffs.common};
        });
      }
      if(change&&edit){                                                           //子树有不一致，标记修改
        diffs.edit[leftNode.id]=createDiff(leftNode.id,rightNode.id);
        diffs.rightEdit[rightNode.id]=createDiff(leftNode.id,rightNode.id);
      }
      return diffs;
    },

    //%test
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
    getRef(){
      console.log($("#node_6")[0]);
      console.log($("#node_6").is(":visible"));
      console.log(this.$refs.leftTree);
      console.log($(this.$refs.leftTreeBox).find(".diff-node:visible"));
    }
  }

}
</script>

<style scoped>
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

.diff-node{
  width: 100%;
  text-align: left;
  /*padding: 4px 0;*/
}

.no-pad{/*'无内边距*/
  padding: 0;
}
.left-scroll{/*'右到左*/
  direction: rtl;
}
.left-scroll div{/*'恢复左到右*/
  direction: ltr;
}

.right-scroll{/*'左到右*/
  direction: ltr;
}
.box{
  overflow-y: auto;
  overflow-x: auto;
  position: relative;
}
</style>

<!--全局-->
<style>
.node-add{
  background-color: v-bind('styles.node.add');
}
.node-edit{
  background-color: v-bind('styles.node.edit');
}
.node-removed{
  background-color: v-bind('styles.node.removed');
}
.node-merge-removed{
  background-color: v-bind('styles.node.mergeRemoved');
}



.test-node{
  background-color: red;
}

.test-node1{
  background-color: v-bind('testcolor');
}

.el-tree-node__content{
  box-sizing: border-box!important;
  /*height: auto !important;*/
}

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