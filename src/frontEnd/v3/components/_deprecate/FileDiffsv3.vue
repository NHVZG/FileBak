<template>
  <el-row style="position: fixed;top: 10px;left: 40%;z-index: 99999">
    <el-switch active-text="合并后" inactive-text="全部节点"
               v-model="view.controlPanel.midFilterMode"
               @change="onMidFilterChange"></el-switch>
  </el-row>
  <el-row>
    <el-col :span="7">
      <div class="box left-scroll" :style="`height:${view.boxHeight}`" ref="leftTreeBox">
        <FileTree :tree-data="leftTree" ref="leftTree" :on-tree-item-class="leftTreeItemClass"></FileTree>
      </div>
    </el-col>
    <el-col :span="2">
      <div>
        <canvas ref="canvas1"></canvas>
      </div>
    </el-col>
    <el-col :span="6">
      <div class="box left-scroll" :style="`height:${view.boxHeight}`" @scroll="" ref="midTreeBox">
        <FileTree :tree-data="midTree" :filter-node="filterMidTree" ref="midTree" :on-tree-item-class="midTreeItemClass"></FileTree>
      </div>
    </el-col>
    <el-col :span="2">
      <div>
        <canvas ref="canvas2"></canvas>
      </div>
    </el-col>
    <el-col :span="7">
      <div class="box" :style="`height:${view.boxHeight}`"  ref="rightTreeBox">
        <FileTree :tree-data="rightTree" ref="rightTree" :on-tree-item-class="rightTreeItemClass"></FileTree>
      </div>
    </el-col>

  </el-row>
</template>

<script>
import FileTree from "@/frontEnd/v3/components/FileTree.vue";
import {list2map, findLastParent, treeLeaf} from "@/frontEnd/v3/components/common/util";
import {buildTree, leftTrees, rightTrees} from "@/frontEnd/v3/components/common/temp";
import $ from "jquery";

export default {
  components: {FileTree},
  data() {
    return {
      leftTree:[],
      rightTree:[],
      midTree:[],
      view: {
        boxHeight: 'auto',
        treeItemHeight:26,
        controlPanel:{
          midFilterMode:false
        }
      },
      forest:{
        left: {},
        right: {},
      },
      conf:{
        // 规则如果有target（映射）则penetrate失效
        ruleConfig:{
          except:{inherit:true,penetrate:true, order:1},                      //例外 - 穿透 覆盖其他规则
          remove:{inherit:true,penetrate:true, order:2},                    //删除 - 对远程路径操作
          update:{inherit:true,penetrate:false,order:10},                   //更新 - 仅覆盖已有
          increment:{inherit:true,penetrate:false,order:11},              //新增 - 仅新增文件
          incrementCover:{inherit:true,penetrate:false,order:12},    //更新+新增 - 两种模式的混合
          cover:{inherit:true,penetrate:false,order:12},                     //覆盖 - 完全与源文件路径一致，删除不在受控内的文件
          normal:{inherit:true,penetrate:false,order:100}                 //无
        },
        upload:{
          rules:[
            //{id:1,source:'D',target:'D/1',mode:'cover',type:'exact'},
            //{id:2,source:'.*\.txt',mode:'except',type:'regex'},
            //{id:3,source:'E',mode:'update',type:'exact'},
            //{id:4,source:'F',mode:'increment',type:'exact'},
            //{id:5,source:'G',mode:'incrementCover',type:'exact'},
            //{id:6,source:'H',mode:'remove',type:'exact'},
            //{id:7,source:'K',mode:'except',type:'exact'},
            //{id:8,source:'J',target:'compress.zip',type:'exact',zip:true},   //映射为zip
            {source:'A/a1/a/aa/aaa/increment',mode:'increment',type:'exact'},
            {source:'updated/increment',mode:'increment',type:'exact'},
            {source:'E/e/increment',mode:'increment',type:'exact'},
            {source:'D/d/1remove.txt',mode:'cover',type:'exact'},
            {source:'cover',mode:'cover',type:'exact'},
            {source:'E/e/cover',mode:'cover',type:'exact'},
            //{source:'E/e',mode:'except',type:'exact'},
            {source:'incrementCover',mode:'incrementCover',type:'exact'},
            {source:'E/e/incrementCover',mode:'incrementCover',type:'exact'},
            {source:'updated',mode:'update',type:'exact'},
            {source:'E/e/update',mode:'update',type:'exact'},
            {source:".*/.*?increment\.jpeg$",mode:'increment',type:'regex'},
            {source:".*/cover\.mp4$",mode:'cover',type:'regex'},
            {source:".*/incrementCover\.c$",mode:'incrementCover',type:'regex'},

            {source:'incrementCover/c/except',mode:'except',type:'exact'},
            {source:'except\.zip$',mode:'except',type:'regex'},
            {source:'H/h',mode:'except',type:'exact'},
            {source:'H/h3',mode:'except',type:'exact'},

            {source:'.*/.*?remove\.txt$',mode:'remove',type:'regex'},
            {source:'.*/remove$',mode:'remove',type:'regex'},
            {source:'H/h',mode:'remove',type:'exact'},

            {source:"E",mode:"increment",target: "E2",type:'exact',mappingToChild:true},
            {source:"E",mode:"increment",target: "E3/EE",type:'exact',mappingToChild:false},
            {source:"E/E2",mode:"increment",target: "E2",type:'exact',mappingToChild:true},

            {source:"(^E1\\/((?!\\/).)*$)",mode:"incrementCover",target: "E2",type:'regex',mappingToChild:true},//第一层的映射  mappingToChild:false
            {source:'H/h3',mode:'incrementCover',target:'H/h2',type:'exact',mappingToChild: false},

            {source: 'J',mode:'cover',target:'J/2.zip',type:'exact',mappingToChild: false,zip:true},
            {source: 'J/.*?\.txt',mode:'cover',target:'J/1.zip',type:'regex',mappingToChild: false,zip:true},
            {source: 'J/.*?\.txt',mode:'cover',target:'J/k.zip',type:'regex',mappingToChild: false,zip:true},

            {source: 'J/a.zip/a',target:'J/b.zip/b',type:'exact',mode:'cover',mappingToChild: false,throughZip:true},
            {source: 'J/c',target:'J/b.zip/c',type:'exact',mode:'cover'}

            //{source: 'J/\.*',mode:'cover',target:'J/1.zip',type:'regex',mappingToChild: false,zip:true},
          ]
        }

      }




    }
  },
  mounted() {
    this.leftTree = buildTree(leftTrees, '');
    this.rightTree = buildTree(rightTrees, '');

    let tester={
      regex:rule=>{
        let regex=new RegExp(rule.source);
        return {test:(val)=>regex.test(val)};
      },
      exact:rule=>{
        return {test:(val)=>rule.source===val};
      }
    };

    this.$nextTick(()=> {
      let leftForest = {root:{rule:{match:[],inherit:[]}}}, rightForest={root:{rule:{match:[],inherit:[]}}};
      let leftExtendData={nodes:[],extendForest:[]},rightExtendData={nodes:[],extendForest:[]};
      let leftCheckRules = ['except', 'update', 'increment', 'incrementCover', 'cover'];
      let rightCheckRules = ['remove'];
      let leftRules = this.conf.upload.rules
          .filter(i => leftCheckRules.includes(i.mode))
          .map(i=>({...i,...tester[i.type](i)}))
          .sort((a, b) => this.conf.ruleConfig[a.mode] - this.conf.ruleConfig[b.mode]);
      let rightRules = this.conf.upload.rules
          .filter(i => rightCheckRules.includes(i.mode))
          .map(i=>({...i,...tester[i.type](i)}))
          .sort((a, b) => this.conf.ruleConfig[a.mode] - this.conf.ruleConfig[b.mode]);
      this.diff({base: {children: this.leftTree}, node: leftForest.root}, leftRules, leftForest,leftExtendData);
      this.diff({base: {children: this.rightTree}, node: rightForest.root}, rightRules, rightForest,rightExtendData);
      this.forest.left.bushes=leftForest;
      this.forest.left.tree=leftExtendData.extendForest;
      this.forest.right.bushes=rightForest;
      this.forest.right.tree=rightExtendData.extendForest;

      let mid={};
      let trees=leftExtendData.extendForest.map(tree=>({children:{[tree.name]:tree}}));

      this.mergeTree({children:leftForest.root.children},mid,'left');
      this.mergeTree({children:rightForest.root.children},mid,'right');
      for(let tree of trees) {
        this.mergeTree(tree, mid, 'merge');
      }
      this.midTree=mid.children;


      let leftNodes=this.findBoxVisibleNode(this.$refs.leftTreeBox,this.$refs.leftTree);
      let rightNodes=this.findBoxVisibleNode(this.$refs.rightTreeBox,this.$refs.rightTree);

      this.$nextTick(()=> {
        this.onMidFilterChange(false);
      });

      console.log(leftForest);
      console.log(rightForest);
      console.log(leftExtendData);
      console.log(rightExtendData);
      console.log(mid);
    });
  },

  methods:{
    getMatchRule(data){
      return data.rule?.match?.[0];
    },

    leftTreeItemClass(data,node){
      let a=this.getMatchRule(data);
      if(data.rule&&data.rule.match&&data.rule.match.length>0&&data.rule.match[0].target)return 'mapping';
      let className=data.rule?(data.rule.cur?data.rule.cur.mode:'normal'):'normal';
      return className;
      //return this.getTreeItemClass(data,node,this.forest.left);
    },
    midTreeItemClass(data,node){
      let side=data.left&&data.left.rule&&data.left.rule.cur?data.left:data.right;
      if(!side&&data.merge){
        side=data.merge;
      }
      if(data.merge&&data.merge.mapping)return 'mapping';
      if(!side)return 'normal';
      let className=side.rule?(side.rule.cur?side.rule.cur.mode:'normal'):'normal';

      if(className==='except'){
        //todo:左排除，右删除 则
      }

      return className;
    },
    rightTreeItemClass(data,node){
      let className=data.rule?(data.rule.cur?data.rule.cur.mode:'normal'):'normal';
      return className;
      //return this.getTreeItemClass(data,node,this.forest.right);
    },
    getTreeItemClass(data,node,forest){
      if(!forest)return;
      let ids=data.bsid.split('.');
      let rule;
      for(let i=ids.length-1;i>-1;i--){
        if(forest[ids[i]]){
          let relativePath=data.path.replace(forest[ids[i]].path,"");
          //匹配forest根节点
          if(!relativePath){
            let leaf=forest[ids[i]];
            if(leaf&&leaf.rule&&leaf.rule.cur){
              rule=leaf.rule.cur;
            }
            break;
          }
          //寻找forest子节点
          if(relativePath.startsWith("/"))relativePath=relativePath.replace("/","");
          let leaf=treeLeaf(relativePath,'/',forest[ids[i]].children,'children');
          if(leaf&&leaf.rule&&leaf.rule.cur){
            rule=leaf.rule.cur;
          }
          break;
        }
      }
      if(!rule){
        let leaf=treeLeaf(data.path,'/',forest.root.children,'children');
        if(leaf&&leaf.rule&&leaf.rule.cur){
          rule=leaf.rule.cur;
        }
      }
      return rule ? rule.mode : '';
    },

    onMidFilterChange(type){
      this.$refs.midTree.filter(type);
    },
    filterMidTree(type,data,node){
      let rule=data?.left?.rule?.cur||
          data?.merge?.mapping?.rule?.cur||
          data?.merge?.rule?.cur||
          data?.right?.rule?.cur;
      if(!rule) {
        return !(data.left&&(!data.right)&&(!data?.left?.rule?.cur));
      }





     /* if(data.left||data.merge){
        let rule=data.left?data.left.rule:data.merge.rule;
        if(rule){
          let cur=rule.cur;
          if(cur&&cur.mode==='except')return false;
        }
      }else if(data.right&&data.right.rule&&data.right.rule.cur){
        let cur=data.right.rule.cur
        if(cur&&cur.mode==='remove')return false;
      }*/


      return true;
    },
    buildDrawStruct(leftNodes,rightNodes){



    },




    mergeTree(tree,baseTree,type){
      if(!tree.children)return ;
      for(let entry of Object.entries(tree.children)){
        let name=entry[0];
        let node=entry[1];
        if(!baseTree.children)baseTree.children=[];
        let baseNode=baseTree.children.find(i=>i.name===name);

        let rule=baseTree.rule||{};
        rule[type]=Object.values({...rule[type],...node?.rule?.inherit,...node?.rule?.match}).map(i=>i);


        if(!baseNode){
          let child={[type]: {...node, children: null},name:node.name,path:node.path,type:node.type,rule};
          baseTree.children.push(child);
          baseNode=child;
        }else{
          baseNode[type]={...node, rule,children: null};
        }
        if(node.children){
          this.mergeTree(node,baseNode,type);
        }
      }
    },


    //todo: rule sort
    //pBase: { node base }
    diff(pBase,checkRules,forest,extendData){
      let baseMap = pBase.base?list2map(pBase.base.children,'path'):{};

      for(let entry of Object.entries(baseMap)){
        let path = entry[0];
        let base = entry[1];

        //. 本节点规则匹配
        let normalRules=[],mappingRules=[];
        for(let rule of checkRules){
          if(rule.test(base.path)){
            if(!rule.throughZip&&base.inZip)continue;//不读取zip中文件
            (rule.target?mappingRules:normalRules).push({...rule});
          }
        }
        let matchRules=mappingRules.concat(normalRules);

        let curRule;
        let pRule=pBase.node.rule?pBase.node.rule.cur:null;
        if(pRule){
          if(this.conf.ruleConfig[pRule.mode].penetrate){
            curRule=pRule;
          }
        }
        if(!curRule&&matchRules.length>0){
          curRule=matchRules[0];
        }
        if(!curRule&&pRule){
          curRule=pRule;
        }

        let inherits=[...pBase.node.rule.match,...pBase.node.rule.inherit].filter(i=>{
          if(!i.throughZip&&base.inZip)return false;//不读取zip中文件
          return i&&this.conf.ruleConfig[i.mode].inherit;
        });
        let node= {id:base.id,bsid:base.bsid,name:base.name,path:base.path,type:base.type,rule: {cur: curRule, match: matchRules, inherit: inherits}};
        base.rule={cur: curRule, match: matchRules, inherit: inherits};
        base.pNodes=extendData.nodes;

        let extendNodes=[];
        if(mappingRules.length>0) {
          //forest.push(node);
          forest[base.id]=node;
          //扩展映射树
          for(let rule of mappingRules){
            let extend=this.buildTreeByPath(rule.mappingToChild||rule.zip?rule.target+'/'+base.name:rule.target);
            extend.leaf.type=base.type;
            if(rule.zip)extend.parent.type=4;
            extendData.extendForest.push(extend.root);
            extend.leaf.mapping= {...node};
            extendNodes.push({node:extend.leaf,rule});
          }
        }else{
          if (!pBase.node.children) pBase.node.children = {};
          pBase.node.children[base.name]=node;
        }
          //扩展映射树
          for(let n of extendData.nodes){
            let e=n.node;
            if(!n.rule.throughZip&&base.inZip)continue;//不读取zip中文件
            let ex={...node,name:base.name,type:base.type,path:`${e.path}/${base.name}`};
            extendNodes.push({node:ex,rule:n.rule});
            e.children=e.children||[];
            e.children.push(ex);
          }
        this.diff({node,base},checkRules,forest, {extendForest:extendData.extendForest,nodes:extendNodes});
      }

    },


    buildTreeByPath(path){
      let obj={};
      let parent,p;
      let root=obj;
      let start=0,end=0;
      path=path+'/';
      while((end=path.indexOf('/',start))>0){
        obj.name=path.substring(start,end);
        obj.path=path.substring(0,end);
        obj.type=1;
        if(parent) {
          if(!parent.children)parent.children ={};
          parent.children[obj.name]=obj;
        }
        p=parent;
        let o={};
        //obj.children=[o];
        parent=obj;
        obj=o;
        start=end+1;
      }
      //delete parent['children'];
      return {root,leaf:parent,parent:p};
    },


    findBoxVisibleNode(treeBoxRefs,treeRef){                                                            //. 获得滚动窗口可视节点(暂时显示全部）
      let start=Math.floor(treeBoxRefs.scrollTop/this.view.treeItemHeight)-1;       //可视起始项坐标
      start=start<0?0:start;
      let origin=start*this.view.treeItemHeight-treeBoxRefs.scrollTop;                         //绘图起始点作为绘图坐标原点y （滚动节点一半情况）
      return $(treeBoxRefs)
          .find(".diff-node:visible")
          .toArray()
          //.splice(start,this.view.viewPortNodes)
          .map((n,idx)=>({
            e: n,                                                                   //起始y
            y: origin + this.view.treeItemHeight * idx,
            id: n.dataset.nodeId,
            node:treeRef.getNode(n.dataset.nodeId),
            level:parseInt(n.dataset.nodeLevel)
          }));
    },



  }
}
</script>


<style>
/*body {
  !*background-color: /#ff0000;*!
}
.increment{
 background-color: #bbf9a2;
}
.incrementCover{
 background-color: #a2f9eb;
}
.update{
 background-color: #e0f9a2;
}
.except{
 background-color: #8d8d8d;
}
.cover{
 background-color: #97a1f4;
}
.remove{
  background-color: #e7a3be;
}
.mapping{!*>div:nth-child(1):after*!

}
.mapping>div:nth-child(1){
  background-color: #debde7;
}
.normal{
  background-color: white;
}*/
</style>
