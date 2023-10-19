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

<style>
body {
  /*background-color: /#ff0000;*/
}
</style>

<script>
import FileTree from "@/frontEnd/v3/components/FileTree.vue";
import {buildTree, leftTrees, rightTrees} from "@/frontEnd/v3/components/common/temp";

let RULE_CONFIGS={};

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
      conf: {

        //penetrate 代表父规则覆盖子规则
        // 规则如果有target（映射）则penetrate失效
        ruleConfig: {
          except: {inherit: true, penetrate: true, order: 1},                      //例外 - 穿透 覆盖其他规则
          remove: {inherit: true, penetrate: true, order: 2},                    //删除 - 对远程路径操作
          mapping: {inherit: true, penetrate: false, order: 3},                  //映射

          //. 互斥规则
          update: {inherit: true, penetrate: false, order: 10},                   //更新 - 仅覆盖已有
          increment: {inherit: true, penetrate: false, order: 11},              //新增 - 仅新增文件
          incrementUpdate: {inherit: true, penetrate: false, order: 12},    //更新+新增 - 两种模式的混合
          cover: {inherit: true, penetrate: false, order: 13},                     //覆盖 - 完全与源文件路径一致，删除不在受控内的文件
          normal: {inherit: true, penetrate: false, order: 100}                 //无
        },
        upload: {
          rule: [
            {base: 'base/A', mode: 'increment'},
            {base: 'base/B', mode: 'update'},
            {base: 'base/C', mode: 'incrementUpdate'},
            {base: 'base/D', mode: 'cover'},
            {base: 'base/E', mode: 'except'},
            {base: 'base/F', mode: 'remove'},  //. mappingMode
            //{base:'base',relative: 'G',target:'base/G',mode:'mapping'},
            /* {base:'base/G1',relative:'',target:'',mode:'mapping',
               mappingToChild:true,shieldParent:true,zip:true},*/
            //{base:'base/H',relative:'/.*',type:'regex',mode:'increment',through:true},
            {base: 'base/cover', mode: 'cover'},
            {base: 'base/update', mode: 'update'},
            {base: 'base/incrementUpdate', mode: 'incrementUpdate'},
            {base: 'base/increment', mode: 'increment'},
            {base: 'base/except', mode: 'except'},
            {base: 'base/remove', mode: 'remove'},
            {base:'base/mapping/#mapping@2',target:'base/mapping/#mapping@0',mode:'mapping',shieldParent:true},
            //{base:'base/mapping/#mapping@1/5#mapping@1',target:'base/mapping/#mapping@00/a',mode:'mapping',shieldParent:true},

            {base: 'mix', relative: '/cover', mode: 'cover'},
            {base: 'mix', relative: '/cover/except', mode: 'except'},
            {base: 'mix', relative: '/cover/increment', mode: 'increment'},
            {base: 'mix', relative: '/cover/update', mode: 'update'},
            {base: 'mix', relative: '/cover/increment/incrementUpdate', mode: 'incrementUpdate'},

            {
              base: 'mix',
              relative: '/cover/mapping',
              target: 'mix/MM',
              mode: 'mapping'/*,mappingToChild:true,shieldParent:true*/
            },
            //{base:'mix',relative:'/cover/mapping',mode:'update'},
            {base: 'mix', relative: '/cover/mapping', mode: 'increment'},
            {base: 'mix', relative: '/cover/mapping', mode: 'incrementUpdate'},


            {base: 'mix', relative: '/cover/except/increment', mode: 'increment'},
            {base: 'mix', relative: '/cover/except/mapping', target: 'cover/except/mapping', mode: 'mapping'},


            //{base:'mix',relative:'/cover/mapping/m1',mode:'except'},
          ],

        }
      }
    }
  },
  mounted() {
    RULE_CONFIGS=this.conf.ruleConfig;
    //% 键
    let key=null;
    //% 基础树
    let leftBaseTree = buildTree(leftTrees, '');
    let rightBaseTree = buildTree(rightTrees, '');
    //% 基础树结构
    let leftPb={children:leftBaseTree};
    let rightPb={children:rightBaseTree};
    //% 基础树结构完整转换
    let leftBaseNodeParent=new Node();
    let rightBaseNodeParent=new Node();
    //%映射树容器
    let leftForest=new Node('root','',1);
    let rightForest=new Node('root','',1);
    //% 父节点
    let leftPns=[{root:leftForest,node:leftForest}]
    let rightPns=[{root:rightForest,node:rightForest}];
    //% 规则
    let {rule}=this.conf.upload;
    let leftRules={
      mapRules:new RuleBundle(rule.filter(r=>r.mode==='mapping').map(r=>new RuleItem().rule(r)),key),
      normalRules:new RuleBundle(rule.filter(r=>r.mode!=='mapping'&&r.mode!=='remove').map(r=>new RuleItem().rule(r)),key)
    };
    let rightRules={
      mapRules:new RuleBundle(),
      normalRules:new RuleBundle(rule.filter(r=>r.mode==='remove').map(r=>new RuleItem().rule(r)),key)
    };

    console.log(new Date().getTime());

    this.trees(leftPb,leftPns,leftForest,leftBaseNodeParent,leftRules,key);
    this.trees(rightPb,rightPns,rightForest,rightBaseNodeParent,rightRules,key);

    let midTree=new Node('root','',1);
    this.mergeTree(midTree,leftForest,'left','base');
    this.mergeTree(midTree,rightForest,'right','base');

    console.log(new Date().getTime());

    console.log(leftForest);
    console.log(rightForest);
    console.log(midTree);

    this.leftTree=leftBaseNodeParent.children;
    this.rightTree=rightBaseNodeParent.children;
    this.midTree=midTree.children;


  },

  methods:{
    leftTreeItemClass(data,node) {
      return data.rules.cur()?.config?.mode||'normal';
    },
    rightTreeItemClass(data,node) {
      return data.rules.cur()?.config?.mode||'normal';
    },
    midTreeItemClass(data,node) {
      /*let leftConfig=data?.rules?.cur?.('left');
      if(leftConfig)return leftConfig.config.mode;
      let rightConfig=data?.rules?.cur?.('right');
      if(rightConfig)return rightConfig.config.mode;
      return 'normal';*/
    },
    //. 绑定源节点映射的目标节点
    onRegisterNode(node,data){

    },
    logging(){},

    mergeTree(baseTreeNode,comparedTree,key,nodeKey){
      if(!comparedTree.children)return;
      for(let compared of comparedTree.children){
        let baseNode=baseTreeNode.find(compared.name);
        let child;
        if(baseNode){
          child=baseNode.merge(compared,key,nodeKey);
        }else{
          let node=new Node().from(compared,key);
          node.rules=node.rules.combine(compared.rules);
          child=baseTreeNode.addNode(node)
        }
        this.mergeTree(child,compared,key);
      }
    },

    //, pns=[{root:Node,node:Node}]
    trees(pb,pns=[],
          forest=new Node(),
          baseNodeParent=new Node(),
          {mapRules=new RuleBundle(),normalRules=new RuleBundle()},nodeKey){
      for(let base of pb.children){
        let source=baseNodeParent.addNode(new Node().from(base,nodeKey));

        let mappings=mapRules.check(source); //% 【RuleBundle】
        let curNodes=[],pruning=false;
        //% 映射
        for(let mapping of mappings.get(undefined,[])){   //% 【RuleItem】
          let {config}=mapping;
          let {leaf,root}=this.treeByPath(config.mapping(base.name),base.type,config.zip);
          leaf.rules=normalRules
              .check(source,leaf,root,nodeKey)
              .unshift(mapping.node(source,leaf,root),nodeKey)
              .sorts();
          curNodes.push({node:leaf,root});
          forest.addNode(root);
          pruning=pruning&&config.pruning;
        }
        let leaf;
        if(pruning){
          leaf=curNodes;
        }else{
          let extendCurNodes=[];
          for(let pn of pns){
            let target=pn.node.addNode(new Node().from(base,nodeKey));
            let inherits=pn.node.rules.inherits(source,target,nodeKey,nodeKey);
            target.rules=normalRules.check(source, target,pn.root,nodeKey).combine(inherits).sorts();
            extendCurNodes.push({node:target,root:pn.root});
          }
          leaf=curNodes.concat(extendCurNodes);
        }

        let sourceRules=source.rules;
        leaf.map(l=>sourceRules=sourceRules.combine(l.node.rules,source));
        source.rules=sourceRules.sorts();

        if(!base.children)continue;
        this.trees(base,leaf,forest,source,{mapRules,normalRules})
      }
    },


    treeByPath(path,leafType,zip=false){
      let root;
      let parent=null,leaf=null;
      let start=0,end=0;
      path=path+'/';

      while((end=path.indexOf('/',start))>0){
        if(parent){
          parent.addNode(leaf);
          parent=leaf;
        }
        leaf=new Node(path.substring(start,end),path.substring(0,end),1);
        if(!root)root=leaf;
        if(!parent)parent=new Node();
        start=end+1;
      }
      if(parent){
        parent.addNode(leaf);
      }
      leaf.type=leafType;
      if(zip)parent.type=4;
      return {root,leaf,parent};
    }

  }
}


class Node{
  constructor(name,path,type,inZip=false,children=[],ruleBundle=new RuleBundle(),mainKey) {
    this.name=name;
    this.path=path;
    this.type=type;
    this.inZip=inZip;
    this.children=children;
    this.rules=ruleBundle;
    this.mainKey=mainKey;
  }
  from(base,mainKey){
    this.name=base.name;
    this.path=base.path;
    this.type=base.type;
    this.inZip=base.inZip;
    this.mainKey=mainKey;
    return this;
  }

  //. 合并
  //,node:合并节点，key:目标写入租，nodeKey:node提取组
  merge(node,key,nodeKey){
    this.type=node.type<this.type?node.type:this.type;
    if(key){
      this.rules.set(node.rules.get(nodeKey),key||nodeKey);
    }
    return this;
  }
  //.查找子节点
  find(name){
    return this.children.find(c=>c.name===name);
  }
  //.新增子节点
  //, node：新增节点，target：,inheritRule：是否继承规则，inheritKey:该节点分组，subKey:继承目标分组
  addNode(node,target,{inheritRule=false,subKey,inheritKey=this.mainKey}={}){
    if(inheritRule){
      let inherits=this.rules.inherits(node,target||node,inheritKey,subKey);
      node.rules.set(inherits,subKey);
    }
    this.children.push(node);
    return node;
  }
}


class RuleBundle{
  static MATCH_ALL=0;
  static MATCH_SOURCE=1;
  static MATCH_TARGET=1;

  constructor(ruleList=[],key) {
    this.ruleMap={};
    this.mainKey=key||'base';
    if(ruleList.length>0){
      this.ruleMap[this.mainKey]=ruleList.slice();
    }
  }

  from(ruleMap,key){
    this.ruleMap=ruleMap;
    this.mainKey=key||'base';
    return this;
  }

  set(ruleList=[],key=this.mainKey){
    if(this.ruleMap[key]){
      /*this.ruleMap[key]=*/this.ruleMap[key].push(...ruleList);
    }else{
      this.ruleMap[key]=ruleList.slice();
    }
  }

  //. 插入头部
  unshift(rule,key){
    let ruleList=this.get(key);
    if(ruleList)ruleList.unshift(rule);
    else this.set([rule],key);
    return this;
  }

  get(key=this.mainKey,defaults){
    if(this.ruleMap[key]){
      return this.ruleMap[key];
    }
    return defaults;
  }

  cur(key){
    let rules=this.get(key);
    if(rules){
      let colors=rules.filter(r=>r.config.mode!=='mapping');
      return colors.length>0?colors[0]:rules[0];
    }
  }

  sorts(){
    Object.entries(this.ruleMap)
        .map((entry)=>this.ruleMap[entry[0]]=this.sort(entry[1]));
    return this;
  }

  sort(rules){
    let list=rules.map((r,idx)=>({idx,r}));
    return list
        .sort((a,b)=>{
          let ac=RULE_CONFIGS[a.r.config.mode];
          let bc=RULE_CONFIGS[b.r.config.mode];
          let ai=ac.penetrate?-1*a.r.generation:a.r.generation;
          let bi=bc.penetrate?-1*b.r.generation:b.r.generation;
          if(ai!==bi)return ai-bi;
          if(ac.order!==bc.order)return ac.order-bc.order;
          return a.idx-b.idx;
        })
        .map(x=>x.r);
  }


  combine(ruleBundle,source){
    if(!ruleBundle)return this;
    let map = Object.entries(this.ruleMap).reduce((o, e) => ({...o, [e[0]]: e[1].slice()}), {});
    for(let entry of Object.entries(ruleBundle.ruleMap)){
      let key=entry[0];
      let ruleList=entry[1];
      if(source){
        ruleList=ruleList.filter(s=>s?.nodes?.source===source);
      }
      if(map[key]){
        map[key].push(...ruleList);
      }else{
        map[key]=ruleList;
      }
    }
    return new RuleBundle().from(map,this.mainKey);
  }

  //. 匹配规则 source:原节点，target:映射后的节点
  check(source,target,treeRoot,key,matchMode=RuleBundle.MATCH_ALL){
    let list=this.get(key,[]).map(r=>r.test(source,target)).filter(r=>r);
    switch(matchMode){
      case RuleBundle.MATCH_ALL:break;
      case RuleBundle.MATCH_SOURCE:list=list.filter(l=>l?.nodes?.match===source);break;
      case RuleBundle.MATCH_TARGET:list=list.filter(l=>l?.nodes?.match===target);break;
    }
    let ruleList=list.map(r=>new RuleItem(
        r.config,
        new NodeBundle(source,target,r.match,treeRoot)));
    return new RuleBundle(ruleList,key||this.mainKey);
  }


  //. 继承的规则
  //,source:继承节点原节点，target:继承节点目标节点，inheritKey:该节点分组，subKey:继承目标分组
  inherits(source,target,inheritKey=this.mainKey,subKey=this.mainKey){
    let ruleList= this.get(inheritKey,[])
        .filter(r=>RULE_CONFIGS[r.config.mode].inherit)
        .map(r=>new RuleItem(
            r.config,
            r.nodes.subBundle(source,target),
            true,
            r.generation+1));
    return new RuleBundle(ruleList,subKey);
  }


}


class RuleItem{
  constructor(config,nodes,inherit=false,generation=0) {
    this.config=config;                 //. 规则
    this.nodes=nodes;                  //. 节点集合【NodeBundle】
    this.inherit=inherit;                 //. 是否继承
    this.generation=generation;    //. 继承代数
  }

  rule(r){
    this.config=new Rule(
        r.base,
        r.mode,
        {relative:r.relative,type:r.type},
        {target:r.target,pruning:r.pruning,zip:r.zip,sub:r.sub,dispatch:r.dispatch},
        r.through
    );
    return this;
  }


  test(base,target){
    return this.config.test(base,target);
  }

  node(source,target,root,match,merge){
    this.nodes=new NodeBundle(
        source,
        target||source,
        match||this.nodes?.match,
        root||this.nodes?.root,
        merge||this.nodes?.merge);
    return this;
  }

}

class NodeBundle{
  constructor(source,target,match,root,merge) {
    this.source=source;
    this.target=target;
    this.match=match;
    this.root=root;
    this.merge=merge;
  }

  subBundle(source,target){
    return new NodeBundle(source,target,this.match,this.root,this.merge);
  }
}

class Rule{
  static TYPE_MATCH=0;
  static TYPE_REGEX=1;
  static DISPATCH_TARGET=0;
  static DISPATCH_BASE=1;

  constructor(base, mode,
              {relative, type}={},
              {target, pruning, zip, sub, dispatch}={},
              through) {
    this.base=base;
    this.mode=mode;
    this.relative=relative;
    this.type=type||Rule.TYPE_MATCH;
    this.target=target;
    this.pruning=pruning||false;
    this.zip=zip||false;
    this.sub=sub||false;
    this.dispatch=dispatch||Rule.DISPATCH_TARGET;
    this.through=through||false;
  }
  //. 分发节点
  dispatchNode(source,target){
    return this.dispatch===Rule.DISPATCH_TARGET&&target?target:source;
  }
  //. 测试规则
  test(source,target){
    let node=this.dispatchNode(source,target);
    if(!node.path.startsWith(this.base)){
      return false;
    }
    if(this.type===Rule.TYPE_REGEX&&(!new RegExp(this.relative).test(node.path))){
      return false;
    }
    if(this.type===Rule.TYPE_MATCH&&this.format(this.base,this.relative)!==node.path) {
      return false;
    }
    if(!this.through&&node.inZip) {
      return false;
    }
    return {match:node,config:this};
  }
  //. 映射地址
  mapping(name){
    return this.format(this.sub?`${this.target}/${name}`:`${this.target}`);
  }
  //. 格式化路径
  format(...path){
    return path.join('/').replaceAll(/\/+/gm, '/').replaceAll(/\/$/gm,'');
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