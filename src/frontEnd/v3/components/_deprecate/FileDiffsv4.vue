<template>
  <el-button @click="logging">123</el-button>
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
        <FileTree :tree-data="midTree" ref="midTree" :on-tree-item-class="midTreeItemClass" :on-register-node="onRegisterNode"></FileTree>
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
import {map} from "core-js/internals/array-iteration";

let RULE_CONF={};

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

        //penetrate 代表父规则覆盖子规则
        // 规则如果有target（映射）则penetrate失效
        ruleConfig:{
          except:{inherit:true,penetrate:true, order:1},                      //例外 - 穿透 覆盖其他规则
          remove:{inherit:true,penetrate:true, order:2},                    //删除 - 对远程路径操作
          mapping:{inherit:true,penetrate:false,order:3},                  //映射

          //. 互斥规则
          update:{inherit:true,penetrate:false,order:10},                   //更新 - 仅覆盖已有
          increment:{inherit:true,penetrate:false,order:11},              //新增 - 仅新增文件
          incrementUpdate:{inherit:true,penetrate:false,order:12},    //更新+新增 - 两种模式的混合
          cover:{inherit:true,penetrate:false,order:13},                     //覆盖 - 完全与源文件路径一致，删除不在受控内的文件
          normal:{inherit:true,penetrate:false,order:100}                 //无
        },
        upload:{
          rule:[
            {base:'base/A',mode:'increment'},
            {base:'base/B',mode:'update'},
            {base:'base/C',mode:'incrementUpdate'},
            {base:'base/D',mode:'cover'},
            {base:'base/E',mode:'except'},
            {base:'base/F',mode:'remove'},  //. mappingMode
            //{base:'base',relative: 'G',target:'base/G',mode:'mapping'},
           /* {base:'base/G1',relative:'',target:'',mode:'mapping',
              mappingToChild:true,shieldParent:true,zip:true},*/
            //{base:'base/H',relative:'/.*',type:'regex',mode:'increment',through:true},
            {base:'base/cover',mode:'cover'},
            {base:'base/update',mode:'update'},
            {base:'base/incrementUpdate',mode:'incrementUpdate'},
            {base:'base/increment',mode:'increment'},
            {base:'base/except',mode:'except'},
            {base:'base/remove',mode:'remove'},
            //{base:'base/mapping/#mapping@2',target:'base/mapping/#mapping@0',mode:'mapping',shieldParent:true},
            //{base:'base/mapping/#mapping@1/5#mapping@1',target:'base/mapping/#mapping@00/a',mode:'mapping',shieldParent:true},

            {base:'mix',relative:'/cover',mode:'cover'},
            {base:'mix',relative:'/cover/except',mode:'except'},
            {base:'mix',relative:'/cover/increment',mode:'increment'},
            {base:'mix',relative:'/cover/update',mode:'update'},
            {base:'mix',relative:'/cover/increment/incrementUpdate',mode:'incrementUpdate'},

            {base:'mix',relative:'/cover/mapping',target:'mix/MM',mode:'mapping'/*,mappingToChild:true,shieldParent:true*/},
            //{base:'mix',relative:'/cover/mapping',mode:'update'},
            {base:'mix',relative:'/cover/mapping',mode:'increment'},
            {base:'mix',relative:'/cover/mapping',mode:'incrementUpdate'},


            {base:'mix',relative:'/cover/except/increment',mode:'increment'},
            {base:'mix',relative:'/cover/except/mapping',target:'cover/except/mapping',mode:'mapping'},


            //{base:'mix',relative:'/cover/mapping/m1',mode:'except'},
          ],

        }

      }




    }
  },
  mounted() {
    this.leftTree = buildTree(leftTrees, '');
    this.rightTree = buildTree(rightTrees, '');

    let getNearlyLeftRuleNode=(node)=>{
      if(node?.from?.left)return node.from.left;
      let pb;
      if(!(pb=node?.parent?.right))return null;
      while(pb){
        if(pb?.rules?.left)return pb;
        pb=pb?.parent?.right;
      }
      return null;
    }

    /*let mergeUpdate=(merge,base,pMerge,pBase)=>{
         if(merge.rules){
           if(merge.rules.filter(r=>r.config.mode!=='mapping')?.[0]?.config?.mode==='update')return true;
         }
         return true;
    }*/


    //返回true 合并 否则 过滤
   /* let mergeCover=(merge,base,pMerge,pBase)=>{
      if(pBase?.rules?.['left']){
        let activeRules=pBase.rules['left'].filter(r=>r.config.mode!=='mapping');
        if(activeRules.length===0)return true;
        if(activeRules?.[0]?.config?.mode==='cover'&&(!base))return false;
      }else{
        let nb=getNearlyLeftRuleNode(pBase);
        if(!nb)return true;

        let activeRules=(nb?.rules?.left||[]).filter(r=>r.config.mode!=='mapping');
        if(activeRules.length===0)return true;
        if(activeRules?.[0]?.config?.mode==='cover'&&(!base))return false;
      }
      return true;
    };

    let leftBeforeUpdate=(merge,base,pMerge,pBase)=>{
      if(merge.rules){
        let activeRules=merge.rules.filter(r=>r.config.mode!=='mapping');
        if(activeRules.length===0)return true;
        if(activeRules?.[0]?.config?.mode==='update')return false;
      }
      return true;
    }

    let leftAfterOnlyUpdate=(merge,base,pMerge,pBase)=>{//仅仅处理update规则
      if(merge.rules){
        let activeRules=merge.rules.filter(r=>r.config.mode!=='mapping');
        if(activeRules.length===0)return false;
        if(activeRules?.[0]?.config?.mode==='update')return base;
      }
      return false;
    }

    let mergeByRules=(merge,base,pMerge,pBase)=>merge?.rules?.length>0;
    let mergeExcept=(merge,base,pMerge,pBase)=>merge.rules? (!merge.rules.some(r=>r.config.mode==='except')):true;
    let mergeRemove=(merge,base,pMerge,pBase)=>merge.rules? (!merge.rules.some(r=>r.config.mode==='remove')):true;*/

    let leftUpdates=[];

    let mergeCover=(distributeSub)=>{

       return (merge,base,pMerge,pBase)=>{
          if(pBase?.rules?.['left']){
            let activeRules=pBase.rules['left'].filter(r=>r.config.mode!=='mapping');
            if(activeRules.length===0)return {merge:true,distributeSub};
            if(activeRules?.[0]?.config?.mode==='cover'&&(!base)&&(!leftUpdates.includes(merge.path)))return {merge:false,distributeSub};
          }
          return {merge:true,distributeSub};
        }
    };



    let leftBeforeUpdate=(merge,base,pMerge,pBase)=>{
      if(merge.rules){
        let activeRules=merge.rules.filter(r=>r.config.mode!=='mapping');
        if(activeRules.length===0)return {merge:true,distributeSub:false};
        if(activeRules?.[0]?.config?.mode==='update'){
          leftUpdates.push(merge.path);
          return {merge:false,distributeSub:false};
        }
      }
      return {merge:true,distributeSub:false};
    }

    let leftAfterOnlyUpdate=(merge,base,pMerge,pBase)=>{//仅仅处理update规则
      if(merge.rules){
        let activeRules=merge.rules.filter(r=>r.config.mode!=='mapping');
        if(activeRules.length===0)return {merge:false,distributeSub:false};
        if(activeRules?.[0]?.config?.mode==='update')return {merge:base,distributeSub:false};
      }
      return {merge:false,distributeSub:false};
    }

    let mergeByRules=(merge,base,pMerge,pBase)=>({merge:merge?.rules?.length>0,distributeSub:false});
    let mergeExcept=(merge,base,pMerge,pBase)=>({merge:merge.rules? (!merge.rules.some(r=>r.config.mode==='except')):true,distributeSub:false});
    let mergeRemove=(merge,base,pMerge,pBase)=>({merge:merge.rules? (!merge.rules.some(r=>r.config.mode==='remove')):true,distributeSub:false});


    this.$nextTick(()=> {
      let leftNode=[{children:{}}],rightNode=[{children:{}}];
      let leftForest=[leftNode[0].children],rightForest=[rightNode[0].children];
      let leftRules=this.conf.upload.rule
          .filter(r=>r.mode!=='remove')
          .map(r=>({...r,test:this.ruleTest(r)}));
      let rightRules=this.conf.upload.rule
          .filter(r=>r.mode==='remove')
          .map(r=>({...r,test:this.ruleTest(r)}));
      this.dif({children:this.leftTree,rules:[]},leftNode,leftForest,leftRules);
      this.dif({children:this.rightTree,rules:[]},rightNode,rightForest,rightRules);



      //合并树
      let midTree={name:'root',children:[]};

      //update的先过滤
      for(let tree of leftForest){
        this.mergeTree(midTree,{name:'root',children:tree},this.merge('left',[mergeExcept,mergeByRules,leftBeforeUpdate]));
      }
      for(let tree of rightForest){
        this.mergeTree(midTree,{name:'root',children:tree},this.merge('right',[mergeCover(true),mergeRemove],false,true));
      }
      //右树合并后 update的再合并
      for(let tree of leftForest){
        this.mergeTree(midTree,{name:'root',children:tree},this.merge('left',[leftAfterOnlyUpdate],true));
      }

      this.midTree=midTree.children;

      console.log(leftForest);
      console.log(rightForest);
      console.log(midTree);
    });

  },
  methods:{
    logging(){
      console.log(this.leftTree);
    },

    getLeftClass(data){
      let rules=data?.rules?data.rules:[];
      let colorRules=rules.filter(i=>i.config.mode!=='mapping');
      let activeRule=colorRules.length>0?colorRules?.[0]:rules?.[0];
      if(!activeRule)return '';
      if(activeRule?.config?.mode==='increment'){
        return Array.from(data.target||[]).some(n=>n?.from?.right)?'normal':'increment';
      }
      if(activeRule?.config?.mode==='update'){
        return Array.from(data.target||[]).some(n=>n?.from?.right)?'update':'normal';
      }
      return activeRule?.config?.mode;
    },

    leftTreeItemClass(data,node){
      return this.getLeftClass(data);
      /*let rules=data?.rules?data.rules:[];
      let colorRules=rules.filter(i=>i.config.mode!=='mapping');
      let activeRule=colorRules.length>0?colorRules?.[0]:rules?.[0];
      if(!activeRule)return '';
      if(activeRule?.config?.mode==='increment'){
        data.style=Array.from(data.target||[]).some(n=>n?.from?.right)?'normal':'increment';
        return data.style;
      }
      if(activeRule?.config?.mode==='update'){
        data.style=Array.from(data.target||[]).some(n=>n?.from?.right)?'update':'normal';
        return data.style;
      }
      data.style=activeRule?.config?.mode;
      return data.style;*/
    },
    midTreeItemClass(data,node){
      //let leftRules=data?.rules?.left||[];
      //let rightRules=data?.rules?.right||[];
      //let colorRules=leftRules.filter(i=>i.config.mode!=='mapping');
      //let activeRule=colorRules.length>0?colorRules?.[0]:leftRules?.[0];

      if(!data?.rules?.left||data?.rules?.left.length===0)return 'normal';
      let colors = data.rules.left?.filter(r => r.config.mode !== 'mapping');
      if(colors&&colors.length>0) {
        let style=this.getLeftClass(data?.from?.left);
        switch (style){
          case 'except':return 'normal';
          case 'remove':return 'normal';
          default:return style;
        }
      }else{
        return data.rules.left[0].config.mode;
      }


      l/*et style=this.getLeftClass(data?.from?.left);
      //data?.from?.left?.style;
      //let style=this.leftTreeItemClass(data?.from?.left);
      switch (style){
        case 'except':return 'normal';
        case 'remove':return 'normal';
        default:
          if(!style){
            let leftRules=data?.rules?.left||[];
            let colorRules=leftRules.filter(i=>i.config.mode!=='mapping');
            let activeRule=colorRules.length>0?colorRules?.[0]:leftRules?.[0];
            style=activeRule?.config?.mode;
          }
          return style||'normal';
      }*/

    },
    rightTreeItemClass(data,node){
      return data?.rules?.[0]?.config?.mode||'normal';
    },


    //. 绑定源节点映射的目标节点
    onRegisterNode(node,data){
      if(data?.from?.left){
        if(!data.from.left.target)data.from.left.target=new Set();
        data.from.left.target.add(data);
      }
      if(data?.from?.right){
        if(!data.from.right.target)data.from.right.target=new Set();
        data.from.right.target.add(data);
      }
    },

    //. 继承或匹配规则节点 显示

    mergeTree(baseTree,mergeTree,onMerge){
      let ignoreCur=true;//是否添加父节点
      //for (let mergeNode of mergeTree.children) {
      for (let entry of Object.entries(mergeTree.children)) {
        let mergeNode=entry[1];
        if(!baseTree.children)baseTree.children=[];
        let baseNode=baseTree.children.find(i=>i.name===mergeNode.name);
        //ignore-  忽略本节点，如果有子节点，取决于子节点
        let {node,ignore,distributeSub}=onMerge(mergeNode,baseNode,mergeTree,baseTree);
        ignoreCur=ignoreCur&&ignore;

        if(!node){}
        else if(!mergeNode.children){
          if(!ignore&&(!baseNode)) {//且baseTree没有对应节点
            this.insert(baseTree.children,node);
          }
        }else if(ignore&&distributeSub){

        }else if((node.children instanceof Array&&node.children.length>0)||Object.keys(node).length>0){
          if((!this.mergeTree(node,mergeNode,onMerge)||(!ignore))&&(!baseNode)) {//且baseTree没有对应节点
            this.insert(baseTree.children,node);
            ignoreCur=false;//子节点不能忽略时 父节点也不可忽略
          }
        }
      }
      return ignoreCur;
    },

    insert(children,node){
      children.push(node);
      children.sort((a,b)=>a.name.localeCompare(b.name));
    },

    merge(type,mergeFilter,increments=false,conflictUseBase=false){//增量合并
      return (mergeNode,baseNode,mergeTree,baseTree)=>{
        let ignore=false;
        let distributeSub=false; //ignore=true时是否向子节点传递
        //mergeFilter.map(f=>ignore=ignore||(!f(mergeNode,baseNode,mergeTree,baseTree)));
        mergeFilter.map(f=>{
          let x=f(mergeNode,baseNode,mergeTree,baseTree);
          ignore=ignore||(!x.merge);
          distributeSub=distributeSub||x.distributeSub;
        });

        if(baseNode){
          let fileType=baseNode.type!==mergeNode.type?(conflictUseBase?baseNode.type:mergeNode.type):mergeNode.type;
          if(baseNode?.rules?.[type]){
            if(!increments) {
              let rules = baseNode.rules[type];
              let combineRules = this.sortFilterRule(rules.concat(mergeNode.rules || []));
              let curRules = combineRules.filter(x => !x.inherit);
              if (curRules?.[0]?.config?.mode === 'mapping') {
                baseNode.rules[type] = curRules;
              } else {
                baseNode.rules[type] = combineRules;
              }
              baseNode.type=fileType;
            }

            //if(rules)baseNode.rules[type]=this.sortFilterRule(rules.concat(mergeNode.rules||[]));
            //else baseNode.rules[type]=[...rules];
          }else{
            if(!baseNode.rules)baseNode.rules={};
            if(!baseNode.rules[type])baseNode.rules[type]=[];
            if(mergeNode.rules)baseNode.rules[type]=[...mergeNode.rules];
          }
          if(!baseNode.from)baseNode.from={};
          baseNode.from[type]=mergeNode.origin;
          //if(!baseNode.parent)baseNode.parent={};
          //baseNode.parent[type]=baseTree;

          return {node:baseNode,ignore,distributeSub};
        }else{
          let rules=(mergeNode.rules||[]).map(r=>({...r}));
          let n={...mergeNode,children:[],from:{[type]:mergeNode.origin}/*parent:{[type]:baseTree}*/};
          if(!ignore)n.rules={[type]:rules};
          else delete n.rules;

          return {node:n,ignore:ignore,distributeSub};
        }
      }
    },

    dif(pb,pns,forest,configs){
      if(!pb.children)return;
      for(let base of pb.children){
          let mapping=[],normal=[];
        for(let config of configs){
          if(!config.test(base))continue;
          (config.mode==='mapping'?mapping:normal).push({config,cur:base,root:base,inherit:false,inheritCount:0});
        }
        //排序
        let curRules=this.sortFilterRule(mapping.concat(normal));
        //base节点写入规则
        let inherits=pb.rules
            .filter(r=>this.conf.ruleConfig[r.config.mode].inherit)
            .map(r=>({config:r.config,cur:base,root:r.root,inherit:true,inheritCount:r.inheritCount+1}));
        base.rules=this.sortFilterRule(curRules.concat(inherits));
        //扩展森林
        let curNodes=[],shield=false;
        for(let i=0;i<mapping.length;++i){
          shield=true;
          let m=mapping[i].config;
          shield=m.shieldParent&&shield;
          let extend=this.treeByPath(m.mappingToChild?`${m.target}/${base.name}`:m.target);
          extend.leaf.type=base.type;
          if(m.zip)extend.parent.type=4;
          extend.leaf.rules=[...inherits.filter(r=>this.conf.ruleConfig[r.config.mode].penetrate),...curRules];    //映射节点仅继承穿透规则
          forest.push({[extend.root.name]:extend.root});
          curNodes.push(extend.leaf);
        }

        if(shield){
          this.dif(base,curNodes,forest,configs);
        }else{
          let extendCurNodes=[];
          for(let pn of pns){
            let inherits=(!pn.rules?[]:pn.rules)
                .filter(r=>this.conf.ruleConfig[r.config.mode].inherit)
                .map(r=>({config:r.config,cur:base,root:r.root,inherit:true,inheritCount:r.inheritCount+1}));
            //排序
            let rules=this.sortFilterRule(curRules.concat(inherits));
            if(!pn.children)pn.children={};
            pn.children[base.name]={...base,rules:[...rules],origin:base};
            extendCurNodes.push(pn.children[base.name]);
            delete pn.children[base.name].children;
          }
          this.dif(base,curNodes.concat(extendCurNodes),forest,configs);
        }
      }
    },
    sortFilterRule(rules){
      /*let group=rules
          .reduce((o,r,idx)=>{
            let ruleConfig=this.conf.ruleConfig[r.config.mode];
            //if(onlyInherit&&!ruleConfig.inherit)return o;                                          //不可继承的过滤
            let item=r;
            if(ruleConfig.penetrate||r.config.mode==='mapping'){
              let x=o.penetrate;
              if(!x[r.config.mode])x[r.config.mode]=[];                                                        //根据规则分组
              x[r.config.mode].push(item);
            }else{
              o.normal.push(item);
            }
            return o;
          },{penetrate:{},normal:[]});
      let penetrate= Object
          .entries(group.penetrate)
          .sort((a,b)=>this.conf.ruleConfig[a[0]]-this.conf.ruleConfig[b[0]])
          .reduce((arr,g)=>arr.concat(g[1]),[]);
      return penetrate.concat(group.normal);*/

     /* let group=rules
          .reduce((o,r,idx)=>{
            let ruleConfig=this.conf.ruleConfig[r.config.mode];
            //if(onlyInherit&&!ruleConfig.inherit)return o;                                          //不可继承的过滤
            let item=r;
            let x=ruleConfig.penetrate?o.penetrate:o.normal;
            if(!x[r.config.mode])x[r.config.mode]=[];                                                        //根据规则分组
            x[r.config.mode].push(item);
            return o;
          },{penetrate:{},normal:{}});
      let penetrate= Object
          .entries(group.penetrate)
          .sort((a,b)=>this.conf.ruleConfig[a[0]]-this.conf.ruleConfig[b[0]])
          .reduce((arr,g)=>arr.concat(g[1]),[]);
      let normal= Object
          .entries(group.normal)
          .sort((a,b)=>this.conf.ruleConfig[a[0]]-this.conf.ruleConfig[b[0]])
          .reduce((arr,g)=>arr.concat(g[1]),[]);
      return penetrate.concat(normal);*/

      let group=rules
          .reduce((o,r,idx)=>{
            let ruleConfig=this.conf.ruleConfig[r.config.mode];
            //if(onlyInherit&&!ruleConfig.inherit)return o;                                          //不可继承的过滤
            let item=r;
            if(ruleConfig.penetrate||r.config.mode==='mapping'){
              let x=o.penetrate;
              if(!x[r.config.mode])x[r.config.mode]=[];                                                        //根据规则分组
              x[r.config.mode].push(item);
            }else{
              o.normal.push(item);
            }
            return o;
          },{penetrate:{},normal:[]});
      let penetrate= Object
          .entries(group.penetrate)
          .sort((a,b)=>this.conf.ruleConfig[a[0]]-this.conf.ruleConfig[b[0]])
          .reduce((arr,g)=>arr.concat(g[1]),[]);
      let normal=group.normal.sort((a,b)=>{
          let x=Number.isInteger(a.inheritCount)?a.inheritCount:-1;
          let y=Number.isInteger(b.inheritCount)?b.inheritCount:-1;
          return x===y?this.conf.ruleConfig[a.config.mode].order-this.conf.ruleConfig[b.config.mode].order:x-y;
        });
      return penetrate.concat(normal);                                                                //穿透规则最高优先级
    },

    treeByPath(path){
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
        parent=obj;
        obj=o;
        start=end+1;
      }
      return {root,leaf:parent,parent:p};
    },
    ruleTest(r){
      return base=> {
        if (!base.path.startsWith(r.base)) return false;
        if (base.path === r.base&&(!r.relative)){
          if(base.inZip&&(!r.throughZip))return false;
          return true;
        }
        let path = (r.base + (r.relative||'')).replaceAll(/\/+/gm, '/');
        let res=r.type === 'regex' ? new RegExp(r.relative||'').test(base.path) : base.path === (path);
        if(res){
          if(base.inZip&&(!r.throughZip))return false;
        }
        return res;
      }
    }






  }
}
</script>


<style>
body {
  /*background-color: /#ff0000;*/
}
.increment{
 background-color: #bbf9a2;
}
.incrementUpdate{
 background-color: #a2f9eb;
}
.update{
 background-color: #e0f9a2;
}
.except{
 background-color: #cacaca;
}
.cover{
 background-color: #97a1f4;
}
.remove{
  background-color: #e7a3be;
}
.mapping{/*>div:nth-child(1):after*/

}
.mapping>div:nth-child(1){
  background-color: #debde7;
}
.normal{
  background-color: white;
}

</style>
