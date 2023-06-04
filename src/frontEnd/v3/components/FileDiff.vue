<template>
  <el-row>
    <el-col :span="10">
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

    <el-col :span="10">
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
            {"type":1,"name":"Coding","label":"Coding","path":"D://Coding","display":true,"leaf":false,children: [{"type":1,"name":"Project","label":"Project","path":"D:/Coding/Project","display":true,"leaf":false},{"type":1,"name":"Refer","label":"Refer","path":"D:/Coding/Refer","display":true,"leaf":false,children:[{"type":1,"name":"v","label":"v","path":"D://Coding/Refer/v","display":true,"leaf":false,children:[{"type":1,"name":"f","label":"f","path":"D://Coding/Refer/v/f","display":true,"leaf":true}]}]},
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
                {"type":1,"name":".config2","label":".config2","path":"D:/Coding/.config2","display":true,"leaf":false},
                {"type":1,"name":".config3","label":".config3","path":"D:/Coding/.config3","display":true,"leaf":false}
              ]},
            {"type":1,"name":".Game1","label":"Game1","path":"D:/Coding/Game1","display":true,"leaf":false},
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
            {"type":1,"name":"Coding","label":"Coding","path":"D://Coding","display":true,"leaf":false,children: [{"type":1,"name":".config","label":".config","path":"D:/Coding/.config","display":true,"leaf":false},{"type":1,"name":"Project","label":"Project","path":"D:/Coding/Project","display":true,"leaf":false},{"type":1,"name":"Refer","label":"Refer","path":"D:/Coding/Refer","display":true,"leaf":false,children:[{"type":1,"name":"v","label":"v","path":"D://Coding/Refer/v","display":true,"leaf":false,children:[{"type":1,"name":"f","label":"f","path":"D://Coding/Refer/v/f","display":true,"leaf":false,children:[{"type":1,"name":"h","label":"h","path":"D://Coding/Refer/v/f/h","display":true,"leaf":true}]},{"type":1,"name":"s","label":"s","path":"D://Coding/Refer/v/s","display":true,"leaf":true}]},{"type":1,"name":"t","label":"t","path":"D://Coding/Refer/t","display":true,"leaf":true}]}]},
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
        class:(data,node)=>data.class||data.borderClass?data.class+' '+data.borderClass:''
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
          border:'3px solid ',
          add:{
            class:'node-add',
            fill:['#a5f77f63','#6bf75063','#3AED4663'],
            border:'rgba(21,128,30,0.25)',
            borderBottom:'2px solid '+'rgba(0,255,25,0.11)'
          },
          removed:{
            fill:['#eab4c675','rgba(229,130,162,0.42)','rgba(213,69,105,0.41)'],
            border:'rgba(217,175,175,0.72)',
            borderBottom:'2px solid '+'rgba(217,175,175,0.72)'
          },
          edit:{
            fill:['#D9D9D97C','#B4B4B47C','#9696967C'],
            border:'rgba(95,95,95,0.49)',
          },
          normal:'inherit'
        }
      },
      timer:null
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
    this.diffs=this.diff(
        {id:0,children:this.leftTree},
        {id:0,children:this.rightTree},null,null,
        true,false);                                                                          //初始化对比
    this.viewPortNodes=(this.boxHeight/this.treeItemHeight)+2;                //初始化可视节点数
    //this.read();
    /*window.files.onFileStructReply(function(struct){
      _this.remoteResolve(_this.resolveNode(struct));
    });*/
    //this.compareTree();

 /*   let type=false;
    this.timer=setInterval(()=>{
      $(_this.$refs.leftTreeBox).animate({ scrollTop:type?0: 1273 }, {duration: 2000,queue:false});
      type=!type;
    },5000);*/

  },
  beforeUnmount(){
    clearInterval(this.timer);
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
      let change=this.buildDrawStruct();
      this.drawDiff(change);

      if(this.right.scrolling)return;
      this.left.scrolling=true;

      if(change.firstCommon.left){
        let node=this.$refs.leftTree.getNode(change.firstCommon.left.id);
        let common=this.diffs.common[node.data.path];
        let e=$(this.$refs.rightTree.$el).find(`[data-node-id=${common.r_id}]`)[0];

        this.$refs.rightTreeBox.scrollTo({top: e.offsetTop - change.firstCommon.left.y-5});//behavior: 'smooth' 会导致一直左右滚动
        clearTimeout(this.left.scrollTimer);
        this.left.scrollTimer = setTimeout(() => this.left.scrolling = false, 10);
      }
    },
    onRightBoxScroll(){
      let change=this.buildDrawStruct();
      this.drawDiff(change);

      if(this.left.scrolling)return;
      this.right.scrolling=true;

      if(change.firstCommon.right){
        let node=this.$refs.rightTree.getNode(change.firstCommon.right.id);
        let common=this.diffs.common[node.data.path];
        let e=$(this.$refs.leftTree.$el).find(`[data-node-id=${common.l_id}]`)[0];
        this.$refs.leftTreeBox.scrollTo({top: e.offsetTop - change.firstCommon.right.y-5});
        clearTimeout(this.right.scrollTimer);
        this.right.scrollTimer = setTimeout(() => this.right.scrolling = false, 10);
      }

    },
    buildDrawStruct(){
      let leftNodes=this.findBoxVisibleNode(this.$refs.leftTreeBox);
      let rightNodes=this.findBoxVisibleNode(this.$refs.rightTreeBox);   //{id,e,y,level}
      let change= {
        add: {                                                                                                        //' 左新增
//       __set,                                                                                                      //change.add渲染顺序
//        r_pid: {                                                                                                  //r_pid 左新增节点的父节点对应的右节点id，e为dom，y为起始y坐标，levelChange是否树层次变化，用于区分连续多个不同层次的新增节点
//             link,
//             left:[{node:[{e,l_id}],y,levelChange}],                                             //r_pid对应左列表多组新增节点
//             right:{y,e}                                                                                        //左新增父节点对应的右节点
//        }
        },
        leftEdit:{                                                                                                  //' 左编辑节点（临时）
//          r_id:{l_id,e,y,levelChange,next,delay}                                                //r_id 左编辑节点对应右编辑节点id，l_id为左节点id,e为dom，y左编辑节点起始y坐标，levelChange是否层级变化，next下一个r_id，delay如果左右编辑节点同时可视，需要渲染成同一背景色，因此左边不着色，右边循环时着色
        },
        rightEdit:[                                                                                               //' 右编辑节点
//         {
//            left:{node:[{e,l_id}],y},                                                                      //左边组，e:dom,y:左起始y坐标
//            right:{node:[e,r_id],y}                                                                       //右边组，e:dom,y:右起始y坐标
//         }
        ],
        firstCommon: {                                                                                       //'左列表第一个共同节点或编辑节点
//          left:{e,id,y},                                                                                         //左边列表滚动用
//          right:{e,id,y}                                                                                       //右边列表滚动用
        },
        common: {                                                                                              //' 相同节点或编辑节点（临时）用于右边遍历
//         l_id:{e,y}                                                                                              //l_id左边id，对应e,y
        },
        removed:[                                                                                               //' 右新增
//         {
//           right:{node:[{e,r_id}],y},                                                                    //右边对应的一组e,y
//           left:{e,y,l_pid},                                                                                   //右边组父节点对应的左节点e,y
//           levelChange                                                                                     //左列表是否层级变化||右列表是否层级变化
//         }
        ]
      };
      const {add,leftEdit,common,rightEdit,removed,firstCommon}=change;

      let type;           //上一个列表项类型
      let level;          //上一个列表项层级
      let p_r_id;        //上一个左编辑列表项对应右边列表项id，用于链表
      let next;           //上一个左编辑节点指向的下个节点，用于右列表判断是否需要分开渲染

      for(let left of leftNodes){
        let diffItem;
        if((diffItem=this.diffs.add[left.id])){                                                       //,左新增
          let {r_pid}=diffItem;
          let bundle=add[r_pid];
          if(!bundle){
            bundle=add[r_pid]={left: [], right: {}};
          }
          if(type!=='add'){
            bundle.left.push({node:[{e:left.e,l_id:left.id}],y:left.y,levelChange:false});
            level=left.level;
          }else if(level>left.level){
            bundle.left.push({node:[{e:left.e,l_id:left.id}],y:left.y,levelChange:true});
            level=left.level;
          }else{
            bundle.left[bundle.left.length-1].node.push({e:left.e,l_id:left.id});
          }
          if(!add.__set){
            add.__set=new Set();
          }
          add.__set.add(r_pid);
          type='add';
        }else if((diffItem=this.diffs.edit[left.id])){                                              //, 左编辑
          if(type!=='edit'){
            leftEdit[diffItem.r_id]={l_id:left.id,e:left.e,y:left.y,levelChange:false};
            level=left.level;
          }else if(level>=left.level){
            leftEdit[diffItem.r_id]={l_id:left.id,e:left.e,y:left.y,levelChange:true};
            level=left.level;
          }else{
            leftEdit[diffItem.r_id]={l_id:left.id,e:left.e,y:left.y,levelChange:false};
            leftEdit[p_r_id].next=diffItem.r_id;
          }
          if(!firstCommon.left){
            firstCommon.left={e:left.e,id:left.id,y:left.y};
          }
          common[left.id]={e:left.e,y:left.y,l_id:left.id};
          p_r_id=diffItem.r_id;
          type='edit';
        }else{                                                                                                       //,相同
          if(!firstCommon.left){
            firstCommon.left={e:left.e,id:left.id,y:left.y};
          }
          common[left.id]={e:left.e,y:left.y,l_id:left.id};
          level=null;
          type='common';
        }
      }
      type=null;
      level=null;
      for(let right of rightNodes){
        let diffItem;
        if((diffItem=change.add[right.id])){                                                      //, 左新增
            diffItem.right.y=right.y;
            diffItem.right.e=right.e;
        }
        if((diffItem=this.diffs.removed[right.id])){                                            //,右新增
          let leftNode=change.common[diffItem.l_pid]||{e:null,y:null};
          if(type!=='removed'){
            removed.push({left:{e:leftNode.e,y:leftNode.y,l_pid:leftNode.l_id},right:{node:[{e:right.e,r_id:right.id}],y:right.y},levelChange:false});
            level=right.level;
          }else if(level>right.level){
            removed.push({left:{e:leftNode.e,y:leftNode.y,l_pid:leftNode.l_id},right:{node:[{e:right.e,r_id:right.id}],y:right.y},levelChange:true});
            level=right.level;
          }else{
            removed[removed.length-1].right.node.push({e:right.e,r_id:right.id});
          }
          type='removed';
        }else if((diffItem=this.diffs.rightEdit[right.id])){                                   //,右编辑
          let left=leftEdit[right.id];
          if(left){
            left.delay=true;
          }
          if(type!=='edit'){
            rightEdit.push({right:{node:[{e:right.e,r_id:right.id}],y:right.y},left:left?{node:[{e:left.e,l_id:left.l_id}],y:left.y}:{node:[],y:null},levelChange:false});
            level=right.level;
          }else if(level>=right.level){
            rightEdit.push({right:{node:[{e:right.e,r_id:right.id}],y:right.y},left:left?{node:[{e:left.e,l_id:left.l_id}],y:left.y}:{node:[],y:null},levelChange:true});
            level=right.level;
          }else if(!next){
            rightEdit.push({right:{node:[{e:right.e,r_id:right.id}],y:right.y},left:left?{node:[{e:left.e,l_id:left.l_id}],y:left.y}:{node:[],y:null},levelChange:left&&left.levelChange});
          }else{
            let edits=rightEdit[rightEdit.length-1];
            edits.right.node.push({e:right.e,r_id:right.id});
            edits.levelChange=left?left.levelChange:false;
            if(left)edits.left.node.push({e:left.e,l_id:left.l_id});
          }
          if(!firstCommon.right){
            firstCommon.right={e:right.e,id:right.id,y:right.y};
          }
          next=left?left.next:null;
          type='edit';
        }else{                                                                                                       //,相同
          if(!firstCommon.right){
            firstCommon.right={e:right.e,id:right.id,y:right.y};
          }
          level=null;
          type='common';
        }
      }
      return change;
    },
    drawDiff(changes){
      let canvas=this.$refs.canvas;
      let ctx=canvas.getContext('2d');
      let parent=canvas.parentElement;
      canvas.width=parent.clientWidth;
      canvas.height=parent.clientHeight;
      ctx.clearRect(0, 0, parent.clientWidth, parent.clientHeight);
      //ctx.lineWidth=1;

      let leftTree=this.$refs.leftTree;
      let rightTree=this.$refs.rightTree;
      let radius=35;
      let borderBottomStyle='3px solid ';
      let addFill=this.styles.node.add.fill;
      let editFill=this.styles.node.edit.fill;
      let removedFill=this.styles.node.removed.fill;

      let idx=0;
      for(let r_pid of changes.add.__set){                                                           //' 左新增
        let value=changes.add[r_pid];
        for(let bundle of value.left){
          bundle.levelChange?++idx:(idx=0);
          let index=idx%addFill.length;
          let addStyle=addFill[index];                                                                //循环取色值

          //bundle.node.map(n=>n.e.parentElement.style.backgroundColor=addStyle);
          //if(value.right.e)value.right.e.parentElement.style.borderBottom=borderBottomStyle+addStyle;
          bundle.node.map(n=>leftTree.getNode(n.l_id).data.class=`node-add${index}`);
          rightTree.getNode(r_pid).data.borderClass='node-border-bottom-add';


          if(typeof bundle.y!=='number'||typeof value.right.y!=='number')continue;
          ctx.strokeStyle=addStyle;
          ctx.fillStyle=addStyle;

          let left1={x:-1,y:bundle.y};                                                                    //-1延申到不可视区域 防止最后闭合曲线导致留下边框
          let left2={x:-1,y:bundle.y+bundle.node.length*this.treeItemHeight};
          let right1={x:parent.clientWidth,y:value.right.y+this.treeItemHeight};

          ctx.beginPath();
          ctx.moveTo(left1.x, left1.y);
          ctx.bezierCurveTo(left1.x+radius,left1.y,right1.x-radius,right1.y,right1.x,right1.y-2);
          ctx.bezierCurveTo(right1.x-radius,right1.y,left2.x+radius+10,left2.y,left2.x,left2.y);
          ctx.closePath();
          ctx.stroke();
          ctx.fill();
        }
      }
      idx=0;
      for(let value of Object.values(changes.leftEdit)){                            //'左编辑节点
        value.levelChange?++idx:(idx=0);
        //let editStyle=editFill[idx%editFill.length];
        //if(!value.delay)value.e.parentElement.style.backgroundColor=editStyle;
        if(!value.delay)leftTree.getNode(value.l_id).data.class=`node-edit${idx%editFill.length}`;
      }
      idx=0;
      for(let value of changes.rightEdit){                                                        //'右编辑节点
        value.levelChange?++idx:(idx=0);
        let index=idx%editFill.length;
        let editStyle=editFill[index];

        //value.left.e.map(e=>e.parentElement.style.backgroundColor=editStyle);
        //value.right.e.map(e=>e.parentElement.style.backgroundColor=editStyle);

        value.left.node.map(n=>leftTree.getNode(n.l_id).data.class=`node-edit${index}`);
        value.right.node.map(n=>rightTree.getNode(n.r_id).data.class=`node-edit${index}`);

        if(typeof value.left.y!=='number'||typeof value.right.y!=='number')continue;

        ctx.strokeStyle=editStyle;
        ctx.fillStyle=editStyle;
        let left1={x:-1,y:value.left.y};
        let left2={x:-1,y:value.left.y+value.left.node.length*this.treeItemHeight};
        let right1={x:parent.clientWidth+1,y:value.right.y};
        let right2={x:parent.clientWidth+1,y:value.right.y+value.right.node.length*this.treeItemHeight};
        ctx.beginPath();
        ctx.moveTo(left1.x, left1.y);
        ctx.bezierCurveTo(left1.x+radius,left1.y,right1.x-radius,right1.y,right1.x,right1.y);
        ctx.lineTo(right2.x,right2.y);
        ctx.bezierCurveTo(right2.x-radius,right2.y,left2.x+radius,left2.y,left2.x,left2.y);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
      }
      idx=0;
      for(let value of changes.removed){
        value.levelChange?++idx:(idx=0);
        let index=idx%removedFill.length;
        let removedStyle=removedFill[index];

        //value.right.e.map(e=>e.parentElement.style.backgroundColor=removedStyle);
        //if(value.left.e)value.left.e.parentElement.style.borderBottom=borderBottomStyle+removedStyle;
        value.right.node.map(n=>rightTree.getNode(n.r_id).data.class=`node-removed${index}`);
        if(value.left.l_pid)leftTree.getNode(value.left.l_pid).data.borderClass=`node-border-bottom-removed`;

        if(typeof value.left.y!=='number'||typeof value.right.y!=='number')continue;

        ctx.strokeStyle=removedStyle;
        ctx.fillStyle=removedStyle;
        let left1={x:0,y:value.left.y+this.treeItemHeight};
        let right1={x:parent.clientWidth+1,y:value.right.y};
        let right2={x:parent.clientWidth+1,y:value.right.y+value.right.node.length*this.treeItemHeight};
        ctx.beginPath();
        ctx.moveTo(left1.x, left1.y-1);
        ctx.bezierCurveTo(left1.x+radius,left1.y,right1.x-radius,right1.y,right1.x,right1.y);
        ctx.lineTo(right2.x,right2.y);
        ctx.bezierCurveTo(right2.x-radius-10,right2.y,left1.x+radius,left1.y,left1.x,left1.y);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
      }
    },
    findBoxVisibleNode(treeBoxRefs){                                                            //. 获得滚动窗口可视节点(暂时显示全部）
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
    getParents(type,id){
      let a;
      let side;
      let common;
      let set=new Set();
      switch (type){
        case 'left':    a=this.diffs.edit;
                             common=this.diffs.rightCommon;
                             side='l';break;
        case 'right':  a=this.diffs.rightEdit;
                             common=this.diffs.leftCommon;
                             side='r';break;
      }
      let p=a[id]||common[id];
      if(p) {
        let pid=p[`${side}_pid`];
        while ((p=a[pid]||common[pid])) {
          set.add(p[`${side}_id`])
          pid=p[`${side}_pid`];
          if(set.has(pid))break;
        }
      }
      return set;
    },
    diff(leftNode, rightNode,l_pid,r_pid, deep = false,edit=true) {                                 //. 比较左右树
      let diffs={
        add:{},                         //左边新增节点
        edit:{},                         //相同结构，子节点不同
        rightEdit:{},                 //右编辑节点
        removed:{},                 //右边新增节点
        common:{},                //
        leftCommon:{},          //左相同节点
        rightCommon:{},       //右相同节点
      };
      let createChildDiff=(l_id,r_id)=>({
        l_id,                             //左节点id
        r_id,                             //右节点id
        l_pid:leftNode.id,       //左父节点id
        r_pid:rightNode.id     //右父节点id
      });
      let createDiff=(l_id,r_id)=>({
        l_id,                             //左节点id
        r_id,                             //右节点id
        l_pid:l_pid,                  //左父节点id
        r_pid:r_pid                  //右父节点id
      });
      let change=false;
      let commons=[];
      let leftMap = list2map(leftNode.children,'path');
      let rightMap = list2map(rightNode.children,'path');
      for(let n of Object.keys(leftMap)){
        if(rightMap[n]&&deep){                                     //相同节点
          diffs.leftCommon[leftMap[n].id]={l_id:leftMap[n].id,r_id:rightMap[n].id,l_pid,r_pid};
          diffs.rightCommon[rightMap[n].id]={l_id:leftMap[n].id,r_id:rightMap[n].id,l_pid,r_pid};

          diffs.common[n]={l_id:leftMap[n].id,r_id:rightMap[n].id};
          commons.push({leftNode:leftMap[n],rightNode:rightMap[n]});
        }else{                                                                     //左边新增节点
          let left=leftMap[n];
          change=true;
          //diffs.add[left.id]=createDiff(left.id);
          recursiveTree(left,'children',(node)=>diffs.add[node.id]=createChildDiff(node.id));
        }
      }
      Object.keys(rightMap).map(n=>{                  //右边新增节点
        if(!leftMap[n]){
          let right=rightMap[n];
          change=true;
          //diffs.removed[right.id]=createDiff(null,right.id);
          recursiveTree(right,'children',(node)=>diffs.removed[node.id]=createChildDiff(node.id));
        }
      });
      if(deep){                                                                 //递归子节点
        commons.map(c=>{
          let subDiffs=this.diff(c.leftNode,c.rightNode,leftNode.id,rightNode.id,deep)
          if((subDiffs.add&&Object.keys(subDiffs.add).length>0)||
              (subDiffs.removed&&Object.keys(subDiffs.removed).length>0)||
              (subDiffs.edit&&Object.keys(subDiffs.edit).length>0))change=true;
          diffs.add={...diffs.add,...subDiffs.add};
          diffs.edit={...diffs.edit,...subDiffs.edit};
          diffs.rightEdit={...diffs.rightEdit,...subDiffs.rightEdit};
          diffs.removed={...diffs.removed,...subDiffs.removed};
          diffs.common={...diffs.common,...subDiffs.common};
          diffs.leftCommon={...diffs.leftCommon,...subDiffs.leftCommon};
          diffs.rightCommon={...diffs.rightCommon,...subDiffs.rightCommon};
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
/*
.el-tree-node__content:hover {
  background-color: #dcecf9 !important;
}
.el-tree-node:focus>.el-tree-node__content{
  background-color: #dcecf9!important;
}*/

/*左新增*/
.node-add0>.el-tree-node__content{
  background-color: v-bind('styles.node.add.fill[0]');
}
.node-add1>.el-tree-node__content{
  background-color: v-bind('styles.node.add.fill[1]');
}
.node-add2>.el-tree-node__content{
  background-color: v-bind('styles.node.add.fill[2]');
}
.node-border-bottom-add>.el-tree-node__content{
  border-bottom: v-bind('styles.node.add.borderBottom');
}
/*左编辑*/
.node-edit0>.el-tree-node__content{
  background-color: v-bind('styles.node.edit.fill[0]');
}
.node-edit1>.el-tree-node__content{
  background-color: v-bind('styles.node.edit.fill[1]');
}
.node-edit2>.el-tree-node__content{
  background-color: v-bind('styles.node.edit.fill[2]');
}
/*右新增*/
.node-removed0>.el-tree-node__content{
  background-color: v-bind('styles.node.removed.fill[0]');
}
.node-removed1>.el-tree-node__content{
  background-color: v-bind('styles.node.removed.fill[1]');
}
.node-removed2>.el-tree-node__content{
  background-color: v-bind('styles.node.removed.fill[2]');
}
.node-border-bottom-removed>.el-tree-node__content{
  border-bottom: v-bind('styles.node.removed.borderBottom');
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

.el-tree-node__content {
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