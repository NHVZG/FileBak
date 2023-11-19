<template>

<!--    <el-switch active-text="合并后" inactive-text="全部节点"  v-model="view.controlPanel.midFilterMode" @change="onMidFilterChange"></el-switch>&nbsp;-->
  <el-switch active-text="收敛" inactive-text="发散"  v-model="view.controlPanel.convergence" @change="onMidBoxScroll"></el-switch>&nbsp;
  <el-switch active-text="渐变" inactive-text="单色"  v-model="view.controlPanel.linearGradient" @change="onMidBoxScroll"></el-switch>&nbsp;
  <el-switch active-text="同步" inactive-text="独立"  v-model="view.controlPanel.scrollSync" @change="onMidBoxScroll"></el-switch>
  <br>
  <el-button @click="refresh">刷新</el-button>
  <p></p>
  <el-row>
    <el-col :span="7">
      <el-scrollbar :height="view.boxHeight" @scroll="onLeftBoxScroll" class="box left-scroll" ref="leftTreeBox"><!--替换原生滚动块，达到无缝-->
        <FileTree :tree-data="leftTree" ref="leftTree" :on-tree-item-class="leftTreeItemClass" :lazy="lazy" :load="loadLeftSub" :expand="onLeftExpand"></FileTree>
      </el-scrollbar>
    </el-col>
    <el-col :span="2">
      <div><!--style="height: 100%"--><!--100%会导致画布拉长，绘制出现偏差-->
        <canvas ref="canvas1" style="height: 100%;width:100%"></canvas>
      </div>
    </el-col>
    <el-col :span="6">
      <el-scrollbar :height="view.boxHeight" @scroll="onMidBoxScroll" class="box left-scroll" ref="midTreeBox">
        <!--   :on-register-node="onRegisterNode"     -->
        <FileTree :tree-data="midTree" ref="midTree" :on-tree-item-class="midTreeItemClass"  :filter-node="filterMidTree" :expand="onMidExpand" :expand-all="true"></FileTree>
      </el-scrollbar>
    </el-col>
    <el-col :span="2">
      <div ><!--style="height: 100%"-->
        <canvas ref="canvas2" style="height: 100%;width:100%"></canvas>
      </div>
    </el-col>
    <el-col :span="7">
      <el-scrollbar :height="view.boxHeight" @scroll="onRightBoxScroll" class="box left-scroll" ref="rightTreeBox">
        <FileTree :tree-data="rightTree" ref="rightTree" :on-tree-item-class="rightTreeItemClass" :lazy="lazy" :load="loadRightSub" :expand="onRightExpand"></FileTree>
      </el-scrollbar>
    </el-col>

  </el-row>
</template>

<script>
import FileTree from "@/frontEnd/v4/components/FileTree.vue";
import {buildTree, leftTrees, rightTrees} from "@/frontEnd/v3/components/common/temp";
import {
  Node,
  NodeBundle,
  Rule,
  RuleBundle,
  RuleItem,
  mergeTree,
  trees,
  treeByPath,
    initComparedRule,
    initBaseRule
} from "@/backend/v4/core/module/fileDiff/fileDiff";
import $ from "jquery";
import {FILE_TYPE} from "@/backend/v4/core/constant/constant";

export default {
  components: {FileTree},
  props: {
    lazy: {type: Boolean,default: false},
    loadBaseChildren: {type: Function,default: () => {}},
    loadComparedChildren: {type: Function,default: () => {}},
    conf:{type:Object,default:{}}
  },
  data() {
    return {
      start:0,
      end:0,
      leftTree:[],
      rightTree:[],
      midTree:[],
      view: {
        scrolling:{
          left:false,
          right:false,
          mid:false,
        },
        timer:{
          left:null,
          right:null,
          mid:null,
        },
        scrollDelay:14,
        boxHeight: 600,
        treeItemHeight:26,
        controlPanel:{
          midFilterMode:false,                                                                               //, 过滤
          convergence:false,                                                                                  //, 收敛
          linearGradient:true,                                                                                 //, 线性渐变
          scrollSync:true                                                                                        //, 滚动同步
        },
        styles:{
          increment: {base:'rgba(187,249,162)',list:['rgba(187,249,162,0.42)'],stroke:'#94d27b'},
          incrementUpdate: {base:'rgba(162,249,235)',list:['rgba(162,249,235,0.42)'],stroke:'#6fcec0'},
          update: {base:'rgba(224,249,162)',list:['rgba(224,249,162,0.42)'],stroke:'#aac365'},
          except: {base:'rgba(202,202,202)',list:['rgba(202,202,202,0.42)'],stroke:'#a08c8c'},
          cover: {base:'rgba(151,161,244)',list:['rgba(151,161,244,0.42)'],stroke:'#7f89df'},
          remove: {base:'rgba(231,163,190)',list:['rgba(231,163,190,0.42)'],stroke:'#d188a6'},
          mapping:{base:'rgba(222,189,231)',list:['rgba(222,189,231,0.42)'],stroke:'#bf94cb'},
          normal:{base:'white',list:['white'],stroke:'white'}
        }
      },

      letfBasePath:'',
      rightBasePath:'',
      leftRootNode:'',
      rightRootNode:'',
      key:undefined,
      leftForest:null,
      rightForest:null,


      /*conf: {
        upload: {
          rule: [
            {base: 'base/A', mode: 'increment'},
            {base: 'base/B', mode: 'update'},
            {base: 'base/C', mode: 'incrementUpdate'},
            {base: 'base/D', mode: 'cover'},
            {base: 'base/E', mode: 'except'},
            {base: 'base/F', mode: 'remove'},  //. mappingMode
            //{base:'base',relative: 'G',target:'base/G',mode:'mapping'},
            /!* {base:'base/G1',relative:'',target:'',mode:'mapping',
               mappingToChild:true,shieldParent:true,zip:true},*!/
            //{base:'base/H',relative:'/.*',type:'regex',mode:'increment',through:true},
            {base: 'base/cover', mode: 'cover'},
            {base: 'base/update', mode: 'update'},
            {base: 'base/incrementUpdate', mode: 'incrementUpdate'},
            {base: 'base/increment', mode: 'increment'},
            {base: 'base/except', mode: 'except'},
            {base: 'base/remove', mode: 'remove'},
            {base:'base/mapping/#mapping@2',target:'base/mapping/#mapping@0',mode:'mapping'/!*,pruning:true*!/},
            //{base:'base/mapping/#mapping@4/#mapping@11',mode:'increment',dispatch: Rule.DISPATCH_TARGET,pruning:true},
            //{base:'base/mapping/#mapping@2/#mapping@11',mode:'increment'},
            {base:'base/mapping/#mapping@2',target:'base/mapping/#mapping@4',mode:'mapping'/!*,pruning:true*!/},
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
              mode: 'mapping'/!*,sub:true,shield:true*!/
              ,pruning:true
              /!*,through:true*!/ //映射穿透
            },
            //{base:'mix',relative:'/cover/mapping',mode:'update'},
            {base: 'mix', relative: '/cover/mapping', mode: 'increment'/!*,through:true*!/},
            {base: 'mix', relative: '/cover/mapping', mode: 'incrementUpdate'},


            {base: 'mix', relative: '/cover/except/increment', mode: 'increment'},
            {base: 'mix', relative: '/cover/except/mapping', target: 'cover/except/mapping', mode: 'mapping'},

            //{base:'mix/cover/mapping/a.zip/a/1@z',mode:'update',through:true},
            {base:'a/a.zip/az',mode:"increment",through:true},
            {base:'a/a.zip/bz',mode:"mapping",target:'a/a.zip/h.zip',zip:true,sub:true,through:true},

            //{base:'a/a.zip/h.zip/bz',mode:"update",through:true,dispatch:Rule.DISPATCH_TARGET},
            {base:'a/a.zip/h.zip/bz',mode:"increment",through:true,dispatch:Rule.DISPATCH_TARGET},

            {base:'a/b.zip/bz/1@bz',mode:"mapping",target:'a/a.zip/h.zip/c@bzzz',through:true},

            //{base:'a/b.zip/az',mode:"increment",through:true},
            {base:'a/b.zip/az',mode:"mapping",target:'a/c.zip',zip:true,sub:true,through:true},


            //{base:'a/a.zip',mode:"mapping", target: 'a/b.zip/bb'},
            //{base:'a/b.zip',mode:"increment",through:true},


            {base:'a/a/1@a',mode:"increment"},


            //{base:'mix',relative:'/cover/mapping/m1',mode:'except'},
          ],
        }
      }*/
    }
  },
  async mounted() {
    this.view.viewPortNodes=(this.view.boxHeight/this.view.treeItemHeight)+2;                //初始化可视节点数
    let canvas1=this.$refs.canvas1;
    let canvas2=this.$refs.canvas2;
    let parent1=canvas1.parentElement;
    let parent2=canvas2.parentElement;
    canvas1.width=parent1.clientWidth;
    canvas1.height=this.view.boxHeight;
    canvas2.width=parent2.clientWidth;
    canvas2.height=this.view.boxHeight;
    window.onresize=()=>{
      let parent1=canvas1.parentElement;
      let parent2=canvas2.parentElement;
      canvas1.width=parent1.clientWidth;
      canvas2.width=parent2.clientWidth;
      this.onMidBoxScroll();
    }
  },

  methods:{
    async refresh_demo(){
      //, 组名
      let key=undefined;
      //, 基础树
      let leftBaseTree = this.leftTree;
      let rightBaseTree = this.rightTree;
      //, 基础树结构
      let leftPb={children:leftBaseTree,rules:new RuleBundle()};
      let rightPb={children:rightBaseTree,rules:new RuleBundle()};
      //, 基础树结构完整转换
      let leftBaseNodeParent=new Node();
      let rightBaseNodeParent=new Node();
      //, 映射树容器
      //let leftForest=new Node('root',this.leftBasePath,1);
      //let rightForest=new Node('root',this.rightBasePath,1);
      let leftForest=new Node('root','',1);
      let rightForest=new Node('root','',1);
      //, 父节点
      let leftPns=[{root:leftForest,node:leftForest}]
      let rightPns=[{root:rightForest,node:rightForest}];
      //, 规则
      let rule=this.conf;
      let leftRules={
        maps:new RuleBundle(rule.filter(r=>r.mode==='mapping').map(r=>new RuleItem().from(r)),key),
        checks:new RuleBundle(rule.filter(r=>r.mode!=='mapping'&&r.mode!=='remove').map(r=>new RuleItem().from(r)),key)
      };
      let rightRules={
        maps:new RuleBundle(),
        checks:new RuleBundle(rule.filter(r=>r.mode==='remove').map(r=>new RuleItem().from(r)),key)
      };

      trees(leftPb,leftPns,leftForest,leftBaseNodeParent,leftRules,key);
      trees(rightPb,rightPns,rightForest,rightBaseNodeParent,rightRules,key);

      let midTree=new Node('root','',1);
      mergeTree(midTree,leftForest,'left','base');
      mergeTree(midTree,rightForest,'right','base');

      this.leftTree=leftBaseNodeParent.children;
      this.rightTree=rightBaseNodeParent.children;
      this.midTree=midTree.children;

      await this.$nextTick(()=>{});

      //this.view.controlPanel.midFilterMode=true;
      this.onMidFilterChange(true);


      await this.$nextTick();


      let canvas1=this.$refs.canvas1;
      let canvas2=this.$refs.canvas2;
      let parent1=canvas1.parentElement;
      let parent2=canvas2.parentElement;
      //canvas1.height=parent1.clientHeight;
      //canvas2.height=parent2.clientHeight;
      canvas1.width=parent1.clientWidth;
      canvas1.height=this.view.boxHeight;
      canvas2.width=parent2.clientWidth;
      canvas2.height=this.view.boxHeight;
      this.view.viewPortNodes=(this.view.boxHeight/this.view.treeItemHeight)+2;                //初始化可视节点数

      window.onresize=()=>{
        let parent1=canvas1.parentElement;
        let parent2=canvas2.parentElement;
        canvas1.width=parent1.clientWidth;
        canvas2.width=parent2.clientWidth;
        this.onMidBoxScroll();
      }
      await this.onMidBoxScroll();
    },


    async refresh(){
      this.initMidTree(this.leftForest,this.rightForest);
      await this.$nextTick(()=>{});
      await this.onMidBoxScroll();
    },

/*

    initSubTree(grandParentNode,parentNode,baseNodes,rules,rootNode,forest){
      let pb=new Node().from(grandParentNode);  //兼容原始结构和Node
      let psb=new Node().from(parentNode);
      psb.rules.append(parentNode.rules,parentNode.rules.mainKey,false);
      //pb.rules.append(grandParentNode.rules,grandParentNode.rules.mainKey,false);
      pb.addNode(psb);
      psb.addNode(baseNodes);
      let pns=[{root:rootNode,node:new Node().from(grandParentNode)}];
      let grandParent=new Node().from(grandParentNode);
      trees(pb,pns,forest,grandParent,rules,this.key);
      return {children:grandParent.children[0].children,parentNode:grandParent.children[0],forest};


      /!*
      let pb=new Node().from(grandParentNode);  //兼容原始结构和Node
      let psb=new Node().from(parentNode);
      psb.rules.append(parentNode.rules,parentNode.rules.mainKey,false);
      //pb.rules.append(grandParentNode.rules,grandParentNode.rules.mainKey,false);
      pb.addNode(psb);
      psb.addNode(baseNodes);
      let pns=[{root:rootNode,node:new Node().from(grandParentNode)}];
      let grandParent=new Node().from(grandParentNode);
      trees(pb,pns,forest,grandParent,rules,this.key);
      return {children:grandParent.children[0].children,parentNode:grandParent.children[0],forest};
      *!/

      /!*
      let pb=new Node().from(parentNode);  //兼容原始结构和Node
      pb.addNode(baseNodes);
      let pns=[{root:rootNode,node:new Node().from(parentNode)}];
      trees(pb,pns,forest,parentNode,rules,this.key);
      return {children:parentNode.children,parentNode,forest};
      *!/
    },

    initRoot(basePath){
      if(!basePath&&basePath==='/'){
        let root=new Node('root',basePath,1);
        return {root,leaf:root};
      }
      return  treeByPath(basePath, FILE_TYPE.DIRECTORY, false);
    },


    initMidTree(leftForest=new Node(),rightForest=new Node()){
      leftForest=leftForest||new Node();
      rightForest=rightForest||new Node();
      let midTree=new Node('root','',1);
      mergeTree(midTree,leftForest,'left','base');
      mergeTree(midTree,rightForest,'right','base');
      let {match,nearest}=this.findNode(midTree,this.rightBasePath);
      if(match){
        this.midTree=match.children;
      }
    },

    loadLeftSub(elNode,resolve){
      this.loadBaseChildren(elNode,(baseNodes)=>{
        this.leftForest=this.forests(this.leftForest,this.leftRootNode);
        let {children,forest}=this.initSubTree(elNode.parent.data,elNode.data,baseNodes,initBaseRule(this.conf,this.key),this.leftRootNode,this.leftForest);
        this.initMidTree(forest,this.rightForest);
        this.leftForest.children.push(...forest.children);
        resolve(children);
      });
    },
    loadRightSub(elNode,resolve){
      this.loadComparedChildren(elNode,(baseNodes)=>{
        this.rightForest=this.forests(this.rightForest,this.rightRootNode);
        let {children,forest}=this.initSubTree(elNode.parent.data,elNode.data,baseNodes,initComparedRule(this.conf,this.key),this.rightRootNode,this.rightForest);
        this.initMidTree(this.leftForest,forest);
        this.rightForest.children.push(...forest.children);
        resolve(children);
      });
    },
    async setLeftTree(baseNodes,basePath){
      let {root,leaf,parent}=this.initRoot(basePath);
      this.leftForest=new Node();
      this.leftForest.addNode(root);
      let {children,forest}=this.initSubTree(parent,leaf,baseNodes,initBaseRule(this.conf,this.key),root,this.leftForest);
      this.initMidTree(forest,this.rightForest);
      this.letfBasePath=basePath;
      this.leftRootNode=root;
      this.leftForest=forest;
      this.leftTree=children;
      await this.$nextTick(()=>{});
      await this.onMidBoxScroll();
    },
    async setRightTree(baseNodes,basePath){
      let {root,leaf,parent}=this.initRoot(basePath);
      this.rightForest=new Node();
      this.rightForest.addNode(root);
      let {children,forest}=this.initSubTree(parent,leaf,baseNodes,initComparedRule(this.conf,this.key),root,this.rightForest);
      this.initMidTree(this.leftForest,forest);
      this.rightBasePath=basePath;
      this.rightRootNode=root;
      this.rightTree=children;
      this.rightForest=forest;
      await this.$nextTick(()=>{});
      await this.onMidBoxScroll();
    },
    forests(forest,root){
      if(forest)return forest;
      forest=new Node().from(root);
      forest.addNode(root.children);
      return forest;
    },

*/

    //, absolutRoot 绝对根路径（D:或者 /)
    //, relativeRoot 相对根路径
    init(absolutRoot,relativeRoot,relativeSubBaseNodes,rules,basePath){
     /* let pb=new Node().from(grandParentNode);  //兼容原始结构和Node
      let psb=new Node().from(parentNode);
      psb.rules.append(parentNode.rules,parentNode.rules.mainKey,false);
      //pb.rules.append(grandParentNode.rules,grandParentNode.rules.mainKey,false);
      pb.addNode(psb);
      psb.addNode(baseNodes);
      let pns=[{root:rootNode,node:new Node().from(grandParentNode)}];
      let grandParent=new Node().from(grandParentNode);
      trees(pb,pns,forest,grandParent,rules,this.key);
      return {children:grandParent.children[0].children,parentNode:grandParent.children[0],forest};*/

      relativeRoot.addNode(relativeSubBaseNodes);
      let pb={children:[absolutRoot],rules:new RuleBundle()};
      let baseNodeParent=new Node();
      let forest=new Node('root','',1);
      let pns=[{root:forest,node:forest}]; //, forest 是pn中的一支
      trees(pb,pns,forest,baseNodeParent,rules,this.key);
      let {match,nearest}=this.findNode(baseNodeParent,basePath);
      return {tree:match.children,forest}
    },
    initSub(absolutRoot,relativeRoot,relativeSubBaseNodes,rules,forest){
      let pnNode=new Node().from(relativeRoot);
      let pb=new Node().from(relativeRoot);
      pb.addNode(relativeSubBaseNodes);

      //let pns=[{root:absolutRoot,node:pnNode}];
      let parentNode=new Node().from(relativeRoot);
      parentNode.rules.append(relativeRoot.rules,relativeRoot.rules.mainKey,false);
      pnNode.rules.append(relativeRoot.rules,relativeRoot.rules.mainKey,false);
      trees(pb,relativeRoot.pns,forest,parentNode,rules,this.key);

      return {children:parentNode.children,forest};
    },

    loadLeftSub(elNode,resolve){
      this.loadBaseChildren(elNode,async (baseNodes)=>{
        let {children,forest}=this.initSub(this.leftRootNode,elNode.data,baseNodes,initBaseRule(this.conf,this.key),this.leftForest);
        this.initMidTree(forest,this.rightForest);
        resolve(children);
        await this.$nextTick(()=>{});
        this.onMidFilterChange(true);
      });
    },
    loadRightSub(elNode,resolve){
      this.loadBaseChildren(elNode,async (baseNodes)=>{
        let {children,forest}=this.initSub(this.rightRootNode,elNode.data,baseNodes,initBaseRule(this.conf,this.key),this.rightForest);
        this.initMidTree(this.leftForest,forest);
        resolve(children);
        await this.$nextTick(()=>{});
        this.onMidFilterChange(true);
      });
    },
    async setLeftTree(baseNodes,basePath){
      let {root,leaf,parent}=this.initRoot(basePath);
      let {tree,forest}=this.init(root,leaf,baseNodes,initBaseRule(this.conf,this.key),basePath);
      this.initMidTree(forest,this.rightForest);
      this.letfBasePath=basePath;
      this.leftRootNode=root;
      this.leftForest=forest;
      this.leftTree=tree;
      await this.$nextTick(()=>{});
      this.onMidFilterChange(true);
      await this.$nextTick(()=>{});
      await this.onMidBoxScroll();
    },
    async setRightTree(baseNodes,basePath){
      let {root,leaf,parent}=this.initRoot(basePath);
      let {tree,forest}=this.init(root,leaf,baseNodes,initComparedRule(this.conf,this.key),basePath);
      this.initMidTree(this.leftForest,forest);
      this.onMidFilterChange(true);
      this.rightBasePath=basePath;
      this.rightRootNode=root;
      this.rightForest=forest;
      this.rightTree=tree;
      await this.$nextTick(()=>{});
      this.onMidFilterChange(true);
      await this.$nextTick(()=>{});
      await this.onMidBoxScroll();
    },
    initMidTree(leftForest=new Node(),rightForest=new Node()){
      leftForest=leftForest||new Node();
      rightForest=rightForest||new Node();
      let midTree=new Node('root','',1);
      mergeTree(midTree,leftForest,'left','base');
      mergeTree(midTree,rightForest,'right','base');
      let {match,nearest}=this.findNode(midTree,this.rightBasePath);
      if(match){
        this.midTree=match.children;
      }
    },
    initRoot(basePath){
      if(!basePath&&basePath==='/'){
        let root=new Node();
        return {root,leaf:root,parent:root};
      }
      return treeByPath(basePath, FILE_TYPE.DIRECTORY, false);
    },


    onLeftExpand(){
      setTimeout(()=>{
        this.onMidBoxScroll();
      },350);
    },
    onMidExpand(){
      setTimeout(()=>{
        this.onMidBoxScroll();
      },350);
    },
    onRightExpand(){
      setTimeout(()=>{
        this.onMidBoxScroll();
      },350);
    },


    //`======内部


    leftTreeItemClass(data,node) {
      data.style=this.getBaseClass(data,node)||'normal';
      return data.style;
    },

    rightTreeItemClass(data,node) {
      data.style=this.getBaseClass(data,node)||'normal'
      return data.style;
    },

    midTreeItemClass(data,node) {
      data.style=this.getMergeClass(data,node)||'normal';
      return data.style;
    },

    getBaseClass(data,node){
      return data?.rules?.cur?.()?.config?.mode||'normal';
    },

    getMergeClass(data,node){
      let left=data.rules.cur('left');
      let right=data.rules.cur('right');
      if(left){
        if(left.config.mode==='except'||left.config.mode==='increment'){
          if(!right)return left.config.mode;
        }
        else if(left.config.mode!=='normal'){
          return left.config.mode;
        }
      }
      if(right)return right.config.mode;

      return 'normal';
    },

    leftDraw(){
      let canvas=this.$refs.canvas1;
      let parent=canvas.parentElement;
      let ctx=canvas.getContext('2d');
      ctx.clearRect(0, 0, parent.clientWidth, parent.clientHeight);

      let leftNodes=this.findBoxVisibleNode(this.$refs.leftTreeBox,this.$refs.leftTree);
      let midNodes=this.findBoxVisibleNode(this.$refs.midTreeBox,this.$refs.midTree);

      let canvasConf=new DrawConf(parent.clientWidth,this.view.treeItemHeight,this.view.controlPanel.convergence)
          .base(leftNodes,undefined,undefined,true)
          .compared(midNodes,'left','left');
      let s1=this.buildDrawStruct(canvasConf);
      this.drawCanvas(canvas,s1.structs1);
      this.drawCanvas(canvas,s1.structs2);
      return {leftNodes,midNodes};
    },

    rightDraw(){
      let canvas=this.$refs.canvas2;
      let parent=canvas.parentElement;
      let ctx=canvas.getContext('2d');
      ctx.clearRect(0, 0, parent.clientWidth, parent.clientHeight);

      let midNodes=this.findBoxVisibleNode(this.$refs.midTreeBox,this.$refs.midTree);
      let rightNodes=this.findBoxVisibleNode(this.$refs.rightTreeBox,this.$refs.rightTree);

      let canvasConf=new DrawConf(parent.clientWidth,this.view.treeItemHeight,this.view.controlPanel.convergence)
          .base(midNodes,'left','right')
          .compared(rightNodes,undefined,undefined,true);
      let s2=this.buildDrawStruct(canvasConf);
      this.drawCanvas(canvas,s2.structs1);
      this.drawCanvas(canvas,s2.structs2);
      return {midNodes,rightNodes};
    },

    async onLeftBoxScroll(){
      let {leftNodes,midNodes}= this.leftDraw();
      if(this.view.scrolling.right||this.view.scrolling.mid||this.view.scrolling.left)return;
      this.view.scrolling.left=true;
      this.scrollSync(leftNodes,midNodes,this.findBoxVisibleNode(this.$refs.rightTreeBox,this.$refs.rightTree),'left');
      clearTimeout(this.view.timer.left);
      this.view.timer.left = setTimeout(() => this.view.scrolling.left = false, this.view.scrollDelay);
    },

    async onRightBoxScroll(){
      let{rightNodes,midNodes}= this.rightDraw();
      if(this.view.scrolling.mid||this.view.scrolling.left||this.view.scrolling.right)return;
      this.view.scrolling.right=true;
      this.scrollSync(this.findBoxVisibleNode(this.$refs.leftTreeBox,this.$refs.leftTree),midNodes,rightNodes,'right');
      clearTimeout(this.view.timer.right);
      this.view.timer.right = setTimeout(() => this.view.scrolling.right = false, this.view.scrollDelay);
    },

    async onMidBoxScroll(){
      let {leftNodes,midNodes}= this.leftDraw();
      let{rightNodes}= this.rightDraw();
      if(this.view.scrolling.left||this.view.scrolling.right||this.view.scrolling.mid)return;
      this.view.scrolling.mid=true;
      this.scrollSync(leftNodes,midNodes,rightNodes,'mid');
      clearTimeout(this.view.timer.mid);
      this.view.timer.mid = setTimeout(() => this.view.scrolling.mid = false, this.view.scrollDelay);
    },

    //. 根据路径找节点
    findNode(tree,path){
      let nearest=tree
      if(!tree.children)return {nearest};
      for(let node of tree.children){
        if(path===node.path){
          return {match:node};
        }
        if(path.startsWith(node.path)){
          nearest=node;
          let finds=this.findNode(node,path);
          if(finds.match)return finds;
        }
      }
      return {nearest};
    },

    //. 根据可视节点+路径 查找其他树的对应节点位置
    findNodeByPath(map,trees){
      if(trees.length===0)return {};
      for(let obj of Object.values(map)){
        if(obj.y<0)continue;
        let path=obj.node.data.path;
        let res=[];
        for(let tree of trees){
          let r=this.findNode({children:tree.tree.treeData},path);
          if(r.match)res.push({...tree,match:r.match});
        }
        if(res.length===trees.length)return {list:res,source:obj};
      }
      return {};
    },

    //. 滚动同步
    scrollSync(left,mid,right,active){                                                                     //, left,mid,right：可视节点，active：滚动的列表[left,mid,right]
      if(!this.view.controlPanel.scrollSync)return;
      let xxx={};                                                                                                   //, 左中右列表公有节点集合
      let xxo={};                                                                                                   //, 左中列表公有节点集合
      let oxx={};                                                                                                   //, 中右列表公有节点集合
      let midMap=Object.values(mid).reduce((o,x)=>({...o,[x.node.data.path]:x}),{});
      for(let n of Object.entries(left)){
        let m=midMap[n[1].node.data.path];
        if(m)xxo[n[1].node.data.path]={left:n[1],mid:m};
      }
      for(let n of Object.entries(right)){
        let l=xxo[n[1].node.data.path];
        if(l){
          l.right=n[1];
          xxx[n[1].node.data.path]=l;
          oxx[n[1].node.data.path]=l;
        }else{
          let m=midMap[n[1].node.data.path];
          if(m)oxx[n[1].node.data.path]={right:n[1],mid:m};
        }
      }

      let map;
      let mainTree;
      let trees=[];
      let offset=0;
      if(Object.keys(xxx).length>0){
        let item=Object.values(xxx)[0];
        if(active==='left'){
          this.$refs.midTreeBox.setScrollTop(item.mid.offset-item.left.y+offset);
          this.$refs.rightTreeBox.setScrollTop(item.right.offset-item.left.y+offset);
        }else if(active==='mid'){
          this.$refs.leftTreeBox.setScrollTop(item.left.offset-item.mid.y+offset);
          this.$refs.rightTreeBox.setScrollTop(item.right.offset-item.mid.y+offset);
        }else if(active==='right'){
          this.$refs.leftTreeBox.setScrollTop(item.mid.offset-item.right.y+offset);
          this.$refs.midTreeBox.setScrollTop(item.mid.offset-item.right.y+offset);
        }
        return;
      }
      let leftTree={tree:this.$refs.leftTree,box:this.$refs.leftTreeBox};
      let midTree={tree:this.$refs.midTree,box:this.$refs.midTreeBox};
      let rightTree={tree:this.$refs.rightTree,box:this.$refs.rightTreeBox};

      if(active==='left'){
        mainTree=this.$refs.leftTree;
        map=left;
        if(Object.keys(xxo).length>0)                 trees=[rightTree];
        else                                                             trees=[midTree,rightTree];
      }else if(active==='mid'){
        mainTree=this.$refs.midTree;
        map=mid;
        if(Object.keys(xxo).length>0)                 trees=[rightTree];
        else if(Object.keys(oxx).length>0)          trees=[leftTree];
        else                                                             trees=[leftTree,rightTree];
      }else if(active==='right'){
        mainTree=this.$refs.rightTree;
        map=right;
        if(Object.keys(oxx).length>0)                 trees=[leftTree];
        else                                                             trees=[leftTree,midTree];
      }
      let res=this.findNodeByPath(map,trees);
      if(res.source){
        let y=res.source.y;
        for(let item of res.list){
          let es=$(`[data-node-id=${item.match.id}]:visible`);
          if(es.length>0){
            item.box.setScrollTop(es[0].parentElement.offsetTop-y+offset);
          }
        }
      }
    },

    //. 绑定源节点映射的目标节点
    onRegisterNode(node,data){

    },

    //. 节点过滤触发事件
    onMidFilterChange(type){
      this.$refs.midTree.filter(type);
    },

    //. 过滤节点
    filterMidTree(param,data,node){
      if(!param)return true;

      let left=data.rules.cur('left');
      let right=data.rules.cur('right');

      if(left){
        if(left.config.mode==='except'&&(!right))return false;
        if(left.config.mode==='update'&&(!right))return false;
        if(left.config.mode==='normal'&&(!right))return false;
      }
      if(right){
        if(right.config.mode==='remove')return false;
        if(right.config.mode==='normal'&&(!node.parent.visible))return false;
      }

      let pLeft=node.parent.data?.rules?.cur?.('left');
      if(pLeft&&(!left)&&pLeft.config.mode==='cover'&&right)return false;
      return true;
    },

    //. 绘制画布
    drawCanvas(canvas,structs){
      let ctx=canvas.getContext('2d');

      ctx.lineWidth = 0.8;
      let offset=0;
      let radius=canvas.width/2;//50;
      //let borderBottomStyle='3px solid ';

      for(let s of structs){

        ctx.strokeStyle=this.view.styles[s.mode].stroke;
        ctx.fillStyle=this.view.styles[s.mode].list[0];

        ctx.beginPath();
        if(s.reversed){
          if (s.points.length === 3) {
            ctx.moveTo(s.points[0].x-offset, s.points[0].y);
            ctx.bezierCurveTo(s.points[0].x - radius, s.points[0].y, s.points[1].x + radius, s.points[1].y, s.points[1].x, s.points[1].y);
            ctx.bezierCurveTo(s.points[1].x + radius, s.points[1].y, s.points[2].x - radius, s.points[2].y, s.points[2].x-offset, s.points[2].y);
          }
        }else {
          if (s.points.length === 3) {
            ctx.moveTo(s.points[0].x+offset, s.points[0].y);
            ctx.bezierCurveTo(s.points[0].x + radius, s.points[0].y, s.points[1].x - radius, s.points[1].y, s.points[1].x, s.points[1].y);
            ctx.bezierCurveTo(s.points[1].x - radius, s.points[1].y, s.points[2].x + radius, s.points[2].y, s.points[2].x+offset, s.points[2].y);
          } else if (s.points.length === 4) {
            ctx.moveTo(s.points[0].x+offset, s.points[0].y);
            ctx.bezierCurveTo(s.points[0].x + radius, s.points[0].y, s.points[1].x - radius, s.points[1].y, s.points[1].x-offset, s.points[1].y);
            ctx.lineTo(s.points[2].x-offset, s.points[2].y);
            ctx.bezierCurveTo(s.points[2].x - radius, s.points[2].y, s.points[3].x + radius, s.points[3].y, s.points[3].x+offset, s.points[3].y);

            if(s.mode!==s.comparedMode&&s.mode!=='normal'&&s.comparedMode!=='normal'&&this.view.controlPanel.linearGradient){
              //let grd=ctx.createLinearGradient(30,0,128,0);
              let grd=ctx.createLinearGradient(s.points[0].x+radius,s.points[0].y+radius,s.points[2].x-radius,s.points[2].y-radius);
              grd.addColorStop(0,this.view.styles[s.mode].list[0]);
              grd.addColorStop(1,this.view.styles[s.comparedMode].list[0]);
              ctx.fillStyle=grd;
            }
          }
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

      }
    },

    //. 构建画布的结构
    buildDrawStruct(drawConf) {
      let structs1 = [];
      let structs2 = [];
      let firstBuilder=drawConf.structBuilder();
      let reverseBuilder=drawConf.reversedBuilder();
      for(let entry of Object.entries(drawConf.baseMap)){                             //, 构建base（base-compared差集）+base关联compared（base和compared并集）的绘画结构
        structs1.push(...firstBuilder.get(entry[1]));
      }
      structs1.push(...firstBuilder.get());

      for (let entry of Object.entries(drawConf.comparedMap)) {                  //, 构建compared（compared-base差集）关联的绘画结构
        if (firstBuilder.sets.has(entry[0])) continue;
        structs2.push(...reverseBuilder.get(entry[1]));
      }
      structs2.push(...reverseBuilder.get());
      return {structs1,structs2};
    },

    //. 获得滚动窗口可视节点(暂时显示全部）
    findBoxVisibleNode(treeBoxRefs,treeRef){
      let div=treeBoxRefs.wrapRef;
      let start=Math.floor(div.scrollTop/this.view.treeItemHeight)-1;               //,可视起始项坐标
      start=start<0?0:start;
      //let origin=start*this.view.treeItemHeight-div.scrollTop;                                //,绘图起始点作为绘图坐标原点y （滚动节点一半情况）
      return $(div)
          .find(".diff-node:visible")
          .toArray()
          .splice(start,this.view.viewPortNodes)
          /*.map(x=>{
            x.title=`pOffsetTop:${x.parentElement.offsetTop},offsetTop:${x.offsetTop}`
            x.parentElement.style.border='1px solid gray'
            return x;
          })*/
          .reduce((o,n,idx)=>({
            ...o,
            [n.dataset.nodeId]:{e: n,
              //y: origin + this.view.treeItemHeight * idx,
              offset:n.parentElement.offsetTop,
              y: n.parentElement.offsetTop-div.scrollTop,                                     //,起始y
              id: n.dataset.nodeId,
              node:treeRef.getNode(n.dataset.nodeId),
              level:parseInt(n.dataset.nodeLevel),
              idx
            },
          }),{});
    },
  }

}

//% 绘制设置
class DrawConf{
  constructor(canvasWidth, listItemHeight,convergence) {
    this.canvasWidth=canvasWidth;                                                                    //, 画布宽度
    this.listItemHeight=listItemHeight;                                                                //, 列表高度
    this.convergence=convergence;                                                                    //, 一对多时是否收敛
  }

  base(baseMap,baseKey,baseMappingKey,source=false){
    this.baseMap=baseMap;                                                                               //, 优先遍历节点集
    this.baseKey=baseKey;                                                                                  //, 优先遍历节点着色规则组名（生效规则只用left）
    this.baseMappingKey=baseMappingKey;                                                      //, 优先遍历节点映射规则组名（合并树，节点来源需用left,right）
    this.comparedMappingId=source?'target':'source';                                        //, 优先遍历节点 获取 被比较节点【NodeBundle】属性名
    return this;
  }

  compared(comparedMap,comparedKey,comparedMappingKey,source=false){
    this.comparedMap=comparedMap;                                                              //, 被比较节点集
    this.comparedKey=comparedKey;                                                                 //, 被比较节点着色规则组名（生效规则只用left）
    this.comparedMappingKey=comparedMappingKey;                                     //, 被比较节点映射规则组名（合并树，节点来源需用left,right）
    this.sourceMappingId=source?'target':'source';                                             //, 被比较节点 获取 优先遍历节点 【NodeBundle】属性名
    return this;
  }

  structBuilder() {
    return new StructBuilder(this.comparedMap, this.comparedMappingId, this.baseKey, this.baseMappingKey,this.canvasWidth, this.listItemHeight, false,this.convergence);
  }

  reversedBuilder(){
    return new StructBuilder(this.baseMap, this.sourceMappingId, this.comparedKey, this.comparedMappingKey,this.canvasWidth, this.listItemHeight, true,this.convergence);
  }
}

//% 色块结构
class Struct{
  static DRAW_TRIANGLE = 1;                            //三角形
  static DRAW_RECTANGLE = 2;                         //矩形
  constructor(ruleItem,treeRuleItem,mode,comparedMode,level,y1,y2,height,width,key,reversed=false,convergence=false) {
    this.ruleItem=ruleItem;                                                    //, 着色规则
    this.treeRuleItem=treeRuleItem;                                      //, 映射规则 表明是原树结构（normal），或者映射到其他树（mapping），normal作为一种特殊的映射
    this.mode=mode;                                                           //, 实际着色类型!=this.ruleItem.config.mode（合并树时，例如左树increment,而右树已有节点，左规则生效为increment,而实际合并生效的规则为normal）
    this.comparedMode=comparedMode||'normal';              //, 渐变时过渡到的着色类型
    this.level=level;                                                               //, 层级
    this.y1=y1;                                                                      //, base y起始坐标
    this.y2=y2;                                                                      //, compared y起始坐标
    this.height=height;                                                         //, 列表项高度
    this.width=width;                                                           //, canvas宽度
    this.key=key;                                                                  //, 组名
    this.reversed=reversed;                                                   //, 色块是否镜像
    this.bp=1;                                                                       //, base 列表项数
    this.next=true;                                                                //, 色块是否闭合
    this.points=[];                                                                 //, 绘点
    this.source=[];                                                                //, base 集合
    this.target=[];                                                                 //, compared 集合
    this.convergence=convergence;                                      //, 一对多时是否收敛
  }

  //.封闭图形绘点
  build(){
    if (this.type === Struct.DRAW_RECTANGLE) {
      let leftY=this.reversed?this.y2:this.y1;                //,左边起始y坐标
      let rightY=this.reversed?this.y1:this.y2;              //,右边起始y坐标

      if(this.convergence){                                          //,多对一收敛
        let source=this.source.map((x,idx)=>({data:x.node.data.style===this.mode?x:null,idx})).filter(x=>x.data);
        let target=this.target.map((x,idx)=>({data:x.node.data.style===this.comparedMode?x:null,idx})).filter(x=>x.data);
        let leftList=this.reversed?target:source;
        let rightList=this.reversed?source:target;

        let offsetLeft1=leftList.length<=0?0:leftList[0].idx*this.height;
        let offsetLeft2=leftList.length<=0?0:leftList[leftList.length-1].idx*this.height;
        let offsetRight1=rightList.length<=0?0:rightList[0].idx*this.height;
        let offsetRight2=rightList.length<=0?0:rightList[rightList.length-1].idx*this.height;

        this.point(0, leftY+offsetLeft1);
        this.point(this.width, rightY+offsetRight1);
        this.point(this.width, rightY +offsetRight2+this.height);
        this.point(0, leftY + offsetLeft2+this.height);
      }else{
        this.point(0, leftY);
        this.point(this.width, rightY);
        this.point(this.width, rightY + this.cp * this.height);
        this.point(0, leftY + this.bp * this.height);
      }
    } else if (this.type === Struct.DRAW_TRIANGLE) {
      let startX=this.reversed?this.width:0;              //,reversed=true->则从右边画起，否则左边
      let endX=this.reversed?0:this.width;
      this.point(startX, this.y1);
      this.point(endX, this.y2 + this.height);
      this.point(startX, this.y1 + this.bp * this.height);
    }
    return this.mode!=='normal'&&this.mode!=='except';
  }

  //.是否闭合封装
  ends(...arg){
    if(this.next) this.next = !this.end(...arg);
    return !this.next;
  }

  //.是否闭合
  end(baseItem,compared,pCompared){
    let base = baseItem.node.data;
    if(!base.rules.cur(this.key))return true;
    let matchConf=
        base.rules.cur(this.key).config.mode==='mapping'?
            base.rules.get(this.key, []).some(r => r.config === this.ruleItem.config):    //, mapping时找到对应的mapping则未闭合
            base.rules.cur(this.key).config === this.ruleItem.config;                            //, 否则以第一个规则是否匹配判断闭合
    if (!matchConf) return true;                                                                           //, 着色规则不同
    if (this.type === Struct.DRAW_TRIANGLE) {
      if (baseItem.node.data.level < this.level) return true;                                    //, 层级小于起始层级，
      if (!pCompared||pCompared.id !== this.pc.id || compared)return true;          //, 三角模式-无对应父节点或者对应父节点非同一个id
    } else if (this.type === Struct.DRAW_RECTANGLE) {
      if (!compared) return true;                                                                           //, 矩形模式-无对应节点
      if(compared.node.data.style!=='normal'){
        if(this.comparedMode!=='normal'&& compared.node.data.style!==this.comparedMode){
          return true;                                                                                             //, 除基础规则外（normal可以收敛，认为不着色），如果compared上色规则不同则闭合
        }
        this.comparedMode=compared.node.data.style;                                       //, 如果compared节点着色规则存在（非normal）,则设置
      }
      if (compared.idx-this.ci !== 1)return true;                                                    //, 可见对应节点顺序不相邻
      this.ci = compared.idx;
      this.cp++;
      this.target.push(compared);                                                                         //,compared  列表项数增1
    }
    this.bp++;                                                                                                    //,base 列表项数增1
    this.source.push(baseItem);
    return false;
  }

  //` 无对应节点 绘图形状类三角
  triangle(pCompared){
    this.type=Struct.DRAW_TRIANGLE;
    this.pc=pCompared;
    return this;
  }
  //` 有对应节点 绘图形状类矩形
  rectangle(ci){
    this.type=Struct.DRAW_RECTANGLE;
    this.cp=1;
    this.ci=ci||1;
  }
  //` 集合添加
  pair(source,target){
    this.source.push(source);
    if(target)this.target.push(target);
    return this;
  }
  //` 添加绘点
  point(x,y){
    this.points.push({x,y});
    return this;
  }
}

//% 色块结构构造器
class StructBuilder {
  constructor(comparedMap, mappingId, key,mappingKey, width, height, reversed,convergence) {
    this.comparedMap = comparedMap;                                                            //, 比较的集合
    this.mappingId = mappingId;                                                                       //, nodes集获取的键名[source,target]
    this.key = key;                                                                                              //, 获取的规则组名
    this.mappingKey = mappingKey;                                                                  //, 获取的规则组名
    this.width = width;                                                                                       //,画布宽度
    this.height = height;                                                                                     //,列表项高度
    this.sets = new Set();                                                                                    //,已匹配到的compared节点
    this.reversed = reversed;                                                                               //,绘图结构镜像
    this.structs = [];                                                                                             //, 绘图结构（映射一对多时多项）
    this.convergence=convergence;                                                                    //, 一对多时是否收敛
  }

  //. 初始化列表项
  init(baseItem){
    let base=baseItem.node.data;
    let cur=base.rules.cur(this.key);
    if(!cur)return [];
    let structs=this.structs.filter(x=>x.next);
    return base.rules
        .get(this.mappingKey,[])
        .filter(r=>{
          switch (r.config.mode){
            case 'normal':return !structs
                    .some(x=>x.treeRuleItem.config.mode==='normal'&&x.mode===cur.config.mode)&&                        //, 映射规则存在normal且着色规则一致则过滤
                (cur.config.mode!=='mapping');                                                                                                             //, 着色规则为mapping则过滤normal规则
            case 'mapping':return !structs.some(x=>x.treeRuleItem.config===r.config);                                               //, 映射规则存在相同的mapping规则则过滤
            default:return false;
          }
        })
        .map(r=>{
          let {compared,pCompared}=this.getCompares(r);
          if(!compared&&(!pCompared))return null;
          if(compared) this.sets.add(compared.id);
          let struct=new Struct(
              cur.config.mode==='mapping'?r:cur,                                  //,  着色规则为mapping则用mapping：否则按其他规则着色
              r,
              base.style,
              compared?compared.node.data.style:null,
              base.level,
              baseItem.y,
              compared?compared.y:pCompared.y,
              this.height,this.width,this.key,this.reversed,this.convergence)
              .pair(baseItem,compared);
          compared?
              struct.rectangle(compared?.idx):
              struct.triangle(pCompared);
          return struct;
        })
        .filter(r=>r);
  }

  //. 获取色块结构
  get(baseItem){
    let res=[];
    for(let struct of this.structs.filter(r=>r.next)){
      if(!baseItem){                                                                                              //, 无baseItem则所有结构封闭
        if(struct.build())res.push(struct);
        continue;
      }
      /*let ruleItem=struct.treeRuleItem.config.mode==='normal'?baseItem.node.data.rules.get(this.key,[]).find(r=>r.config===struct.ruleItem.config):baseItem.node.data.rules.get(this.key,[]).find(r=>r.config===struct.treeRuleItem.config); //, 映射规则如果normal则config不同*/
      let ruleItem=baseItem.node.data.rules.get(this.mappingKey,[]).find(r=>r.config===struct.treeRuleItem.config);
      let {compared,pCompared}= ruleItem?this.getCompares(ruleItem): {};                                        //, 通过映射规则获取映射节点及映射节点父节点
      if(struct.ends(baseItem,compared,pCompared)){
        if(struct.build())res.push(struct);
      }
      if(compared){
        this.sets.add(compared.id);
      }
    }
    if(baseItem) {
      this.structs.push(...this.init(baseItem));                                         //, 初始化
    }
    return res;
  }

  //' 获取compared节点及父节点  【RuleItem】
  getCompares(ruleItem){
    let comparedNode=ruleItem.nodes[this.mappingId];                                     //, 【Node】
    let compared=comparedNode?this.comparedMap[comparedNode.id]:null;
    let pCompared=null;
    if(comparedNode){
      let c=comparedNode;
      while(c.parent){
        if(this.comparedMap[c.parent.id]){
          pCompared=this.comparedMap[c.parent.id];
          break;
        }
        c=c.parent;
      }
    }
    return {compared,pCompared};
  }
}


</script>

<style>
/*body {
  !*background-color: /#ff0000;*!
}
.increment{
  !*background-color: #bbf9a2;*!
  background-color: v-bind('view.styles.increment.base');
}
.incrementUpdate{
  !*background-color: #a2f9eb;*!
  background-color: v-bind('view.styles.incrementUpdate.base');
}
.update{
  !*background-color: #e0f9a2;*!
  background-color: v-bind('view.styles.update.base');
}
.except{
  !*background-color: #cacaca;*!
  background-color: v-bind('view.styles.except.base');
}
.cover{
  !*background-color: #97a1f4;*!
  background-color: v-bind('view.styles.cover.base');
}
.remove{
  !*background-color: #e7a3be;*!
  background-color: v-bind('view.styles.remove.base');
}
.mapping{
  !*background-color: #debde7;*!
  background-color: v-bind('view.styles.mapping.base');
}
.mapping>div:nth-child(1){!*>div:nth-child(1):after*!
  !*background-color: v-bind('view.styles.mapping.base');*!
}
.normal{
  background-color: v-bind('view.styles.normal.base');
}

.zip-increment{

}
.zip-increment>div:nth-child(1):after{
  content: '123';
  float: right;
}


.left-scroll{!*'右到左*!
  !*direction: rtl;*!
}
.left-scroll div{!*'恢复左到右*!
  !*direction: ltr;*!
}
.right-scroll{!*'左到右*!
  !*direction: ltr;*!
}

.box{
  !*使用element-ui滚动组件*!
  !*overflow-y: auto;
  overflow-x: auto;*!
  position: relative;
}
!*.is-current>.el-tree-node__content{
  background-color: red;
}
.el-tree-node__content:hover{
  background-color: red;
}*!
!*
.wrapper {
  float: left;
  animation: background 5s infinite alternate;
}

@keyframes background {
  from {
    background: pink;
  }
  to {
    background: #c0d6ff;
  }
}*!*/
</style>