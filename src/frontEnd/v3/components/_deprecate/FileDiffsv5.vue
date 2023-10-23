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
            //{base:'base/mapping/#mapping@2',target:'base/mapping/#mapping@0',mode:'mapping',shieldParent:true},
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
    this.leftTree = buildTree(leftTrees, '');
    this.rightTree = buildTree(rightTrees, '');

    this.$nextTick(()=>{
      let leftPb={children:this.leftTree,rules:[]};
      let rightPb={children:this.rightTree,rules:[]};
      let leftForest=new Node().node('root','',1);
      let rightForest=new Node().node('root','',1);
      let leftNode=[leftForest]
      let rightNode=[rightForest];
      let leftRules={
        mapRules:new RuleList(this.conf.upload.rule.filter(r=>r.mode==='mapping').map(r=>new RuleItem(new Rule(r)))),
        normalRules:new RuleList(this.conf.upload.rule.filter(r=>r.mode!=='mapping'&&r.mode!=='remove').map(r=>new RuleItem(new Rule(r))))
      };
      let rightRules={
        mapRules:new RuleList(),
        normalRules:new RuleList(this.conf.upload.rule.filter(r=>r.mode!=='remove').map(r=>new RuleItem(new Rule(r))))
      };
      this.diff(leftPb,leftNode,leftForest,leftRules);
      this.diff(rightPb,rightNode,rightForest,rightRules);

      let midTree=new TreeNode('root','root',1);
      this.merge(midTree,leftForest,'left');
      this.merge(midTree,rightForest,'right');
      this.midTree=midTree.children;

      console.log(leftForest);
      console.log(rightForest);
      console.log(midTree);


    });
  },

  methods: {
    leftTreeItemClass(data,node) {

    },
    rightTreeItemClass() {

    },
    midTreeItemClass() {

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

    merge(baseTreeNode,comparedTree,key){
      if(!comparedTree.children)return;
      for(let compared of Object.values(comparedTree.children)){
        let baseNode=baseTreeNode.find(compared.name);
        let baseChild;
        if(baseNode){
          baseChild=baseNode.merge(compared.base(),key);
        }else{
          baseChild=baseTreeNode.child(compared.base(),key)
        }
        this.merge(baseChild,compared,key);
      }
    },

    /**
     * 初始化规则
     * @param pb    children:[]
     * @param pns  children:{}
     * @param forest
     * @param configs
     */
    diff(pb,pns,forest, {mapRules,normalRules}){
      for(let base of pb.children){
        let mappings=mapRules.check(base);
        let curNodes=[],pruning=false;
        for(let mapping of mappings.rules){
          let {config}=mapping;
          pruning=pruning&&config.pruning;
          let {leaf,root}=this.treeByPath(config.mapping(base.name),base.type,config.zip);
          leaf.rules=normalRules.check(base, leaf).unshift(mapping); //.穿透规则需继承，mode=except dispatch必须等于BASE
          forest.child(root);
          curNodes.push(leaf);
        }
        let leaf;
        if(pruning){
          leaf=curNodes;
        }else{
          let extendCurNodes=[];
          for(let pn of pns){
            let target=pn.child(base);
            let inherits=pn.rules.inherits(base,target);
            target.rules=normalRules.check(base, target).combine(inherits);
            extendCurNodes.push(target);
          }
          leaf=curNodes.concat(extendCurNodes);
        }
        base.nodes=leaf.slice(0);
        if(!base.children)continue;
        this.diff(base,leaf,forest,{mapRules,normalRules})
      }
    },

    treeByPath(path,leafType,zip=false){
      let root;
      let parent=null,leaf=null;
      let start=0,end=0;
      path=path+'/';

      while((end=path.indexOf('/',start))>0){
        if(parent){
          parent.child(leaf);
          parent=leaf;
        }
        leaf=new Node().node(path.substring(start,end),path.substring(0,end),1);
        if(!root)root=leaf;
        if(!parent)parent=new Node();
        start=end+1;
      }
      if(parent){
        parent.child(leaf);
      }
      leaf.type=leafType;
      if(zip)parent.type=4;
      return {root,leaf,parent};
    }

  }
}



//element-ui渲染时结构
class TreeNode{
  constructor(name,path,type,children=[],inZip=false,rules={},nodes=[]) {
    this.name=name;                     //文件名
    this.path=path;                        //路径
    this.type=type;                         //文件类型
    this.children=children;             //子文件
    this.inZip=inZip;                       //是否是zip中的文件
    this.rules=rules;                       //规则
    this.nodes=nodes;                   //映射的所有节点
  }

  //. 合并
  merge(node,ruleKey){
    this.type=node.type<this.type?node.type:this.type;
    if(ruleKey)this.rules.set(ruleKey,node.rules);
    return this;
  }
  //. 查找子节点
  find(name){
    return this.children.find(c=>c.name===name);
  }
  //添加子节点
  child(base,key,inheritRule=false){
    if(inheritRule){
      base.rules=this.rules.inherits(base);
    }
    let baseTreeNode=this.find(base.name);
    if(!baseTreeNode){
      this.children.push(base);
    }
    return base;
  }
}

//diff构建的结构
class Node{
  constructor(base,rules=new RuleList(),children={}) {
    this.children=children;
    this.rules=rules;
    if(!base)return;
    this.name=base.name;
    this.path=base.path;
    this.type=base.type;
    this.inZip=base.inZip;
  }
  base(){
    return new TreeNode(this.name,this.path,this.type,[],this.inZip,this.rules);
  }
  get(name){
    return this.children[name];
  }
  //. 合并
  merge(node,ruleKey){
    this.type=node.type<this.type?node.type:this.type;
    if(ruleKey)this.rules.set(ruleKey,node.rules);
    return this;
  }
  //.构建
  node(name,path,type){
    this.name=name;
    this.path=path;
    this.type=type;
    return this;
  }
  //.子节点
  child(base,inheritRule=false){
    let node=base&&base instanceof Node?base:new Node(base);
    if(inheritRule){
      node.rules=this.rules.inherits(base,node);
    }
    this.children[base.name]=node;
    return node;
  }
  //.是否映射节点
  isMapping(){
    return this.rules.hasMapping();
  }
}

class RuleList{
  constructor(rules=[]) {
    this.rules=this.sort(rules);
    this.ruleMap={};
  }
  //. 分组
  set(key,ruleList){
    if(this.ruleMap[key]){
      this.ruleMap[key]=this.ruleMap[key].combine(ruleList);
    }
    this.ruleMap[key]=ruleList instanceof RuleList?ruleList:new RuleList(ruleList);
    return this;
  }
  //. 获取
  group(key){
    if(!key)return this.rules;
    return this.ruleMap[key];
  }
  //.是否有映射的规则
  hasMapping(){
    return this.rules.some(r=>r.config.mode==='mapping');
  }
  //. 排序
  sort(rules){
    let list=rules.map((r,idx)=>({idx,r}));
    return list
        .sort((a,b)=>{
          let ac=RULE_CONFIGS[a.r.config.mode];
          let bc=RULE_CONFIGS[b.r.config.mode];
          let ai=ac.penetrate?-1*a.r.inheritCount:a.r.inheritCount;
          let bi=bc.penetrate?-1*b.r.inheritCount:b.r.inheritCount;
          if(ai!==bi)return ai-bi;
          if(ac.order!==bc.order)return ac.order-bc.order;
          return a.idx-b.idx;
        })
        .map(x=>x.r);
  }
  //. 插入头部
  unshift(rule){
    this.rules.unshift(rule);
    this.rules=this.sort(this.rules);
    return this;
  }
  //. 继承规则
  inherits(base,node){
    let ruleList=this.rules
        .filter(r=>RULE_CONFIGS[r.config.mode].inherit)
        .map(r=>new RuleItem(r.config,new TreeNodeBundle(base,node),r.match,true,r.generation+1));
    return new RuleList(ruleList);
  }
  //. 匹配规则 base:原节点，node:映射后的节点
  check(base,node){
    let ruleList=this.rules
        .filter(r=>r.test(base,node))
        .map(r=>new RuleItem(r.config).root(base,node))
    return new RuleList(ruleList);
  }
  //. 规则合并
  combine(ruleList){
    return new RuleList(this.rules.concat(ruleList.rules));
  }
}


class RuleItem{
  constructor(config,cur,match,inherit=false,generation=0) {
    this.config=config;                         //规则【Rule】
    this.cur=cur;                                   //当前对应节点（继承）集合【TreeNodeBundle】
    this.match=match||cur;                   //匹配规则的节点集合【TreeNodeBundle】
    this.inherit=inherit;                         //是否继承
    this.generation=generation;           //继承传递次数
  }

  root(base,node){
    this.match=new TreeNodeBundle(base,node||base);
    this.cur=new TreeNodeBundle(base,node||base);
    return this;
  }
  current(base,node){
    this.cur=new TreeNodeBundle(base,node||base);
    return this;
  }

  test(base,target){
    return this.config.test(base,target);
  }


}

class TreeNodeBundle{
  constructor(base,node) {
    this.base=base;         //element-ui渲染时结构【TreeNode】
    this.node=node;        //diff构建结构 【Node】
  }
}


//config
class Rule{
  static DISPATCH_BASE=0;                                  //base路径完全匹配时分发
  static DISPATCH_TARGET=1;                              //base匹配target时（mode!=='mapping‘）分发
  static TYPE_MATCH=0;                                      //全匹配
  static TYPE_REGEX=1;                                        //正则

  constructor(rule) {
    this.base=rule.base;                                                                //基础路径
    this.mode=rule.mode;                                                            //规则类型

    this.type=rule.type||Rule.TYPE_MATCH;                                  //相对路径匹配方式：regex(正则)  match()
    this.relative=rule.relative;                                                       //相对路径
    this.target=rule.target;                                                           //目标路径
    this.pruning=rule.pruning||false;                                            //剪枝，false则复制
    this.zip=rule.zip||false;                                                           //打包为zip
    this.sub=rule.sub||false;                                                         //映射为target子节点
    this.dispatch=rule.dispatch||Rule.DISPATCH_TARGET;             //规则分发方式
    this.through=rule.through||false;                                            //穿透zip
  }

  //. 规则测试
  test(base,target){
    let node=this.dispatch===Rule.DISPATCH_TARGET&&target?target:base;
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
    return true;
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


class RuleConfig{
  constructor(name,inherit,penetrate,order){
    this.name = name;                           //规则名
    this.inherit = inherit;                         //可否继承
    this.penetrate = penetrate;               //是否穿透，覆盖子规则
    this.order = order;                            //顺序，低的优先级高
  }
}


</script>
