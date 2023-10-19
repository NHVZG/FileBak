<template>
  <el-row style="position: fixed;top: 10px;left: 40%;z-index: 99999">
    <el-switch active-text="合并后" inactive-text="全部节点"
               v-model="view.controlPanel.midFilterMode"
               @change="onMidFilterChange"></el-switch>
  </el-row>
  <el-row>
    <el-col :span="7">
      <div class="box left-scroll" :style="`height:${view.boxHeight}`" ref="leftTreeBox">
        <FileTree :tree-data="leftTree" ref="leftTree"></FileTree>
      </div>
    </el-col>
    <el-col :span="2">
      <div>
        <canvas ref="canvas1"></canvas>
      </div>
    </el-col>
    <el-col :span="6">
      <div class="box left-scroll" :style="`height:${view.boxHeight}`" @scroll="" ref="midTreeBox">
        <FileTree :tree-data="midTree" :filter-node="filterMidTree" ref="midTree"></FileTree>
      </div>
    </el-col>
    <el-col :span="2">
      <div>
        <canvas ref="canvas2"></canvas>
      </div>
    </el-col>
    <el-col :span="7">
      <div class="box" :style="`height:${view.boxHeight}`"  ref="rightTreeBox">
        <FileTree :tree-data="rightTree" ref="rightTree"></FileTree>
      </div>
    </el-col>

  </el-row>
</template>

<script>
import FileTree from "@/frontEnd/v3/components/FileTree.vue";
import {buildTree, leftTrees, rightTrees} from "@/frontEnd/v3/components/common/temp";
import {
  list2map,
  recursiveTree,
  treeLeaf,
  findLastParent,
  recursiveTreeMap, elTreeParent
} from "@/frontEnd/v3/components/common/util";
import {
  buildRegexRule,
  buildEqualRule,
  buildLeaf,
  onLeaf,
  rulesCheck,
  RULE_CONF
} from "@/frontEnd/v3/components/common/fileDiff";
import $ from "jquery";

export default {
  name: "FileDiffsv2",
  components:{
    FileTree
  },
  data(){
    return{
      view:{
        boxHeight:'auto',
        treeItemHeight:26,
        viewPortNodes:null,   //视窗可见节点数+2
        controlPanel:{
          midFilterMode:false
        }
      },
      leftTree:null,
      midTree:null,
      rightTree:null,
      diffs:null,
      conf:{
        upload:{
          match:[
            {value:'A/a1/a/aa/aaa/increment',type:'1',mode:'exact'},
            {value:'updated/increment',type:'1',mode:'exact'},
            {value:'E/e/increment',type:'1',mode:'exact'},
            {value:'cover',type:'2',mode:'exact'},
            {value:'E/e/cover',type:'2',mode:'exact'},
            {value:'incrementCover',type:'3',mode:'exact'},
            {value:'E/e/incrementCover',type:'3',mode:'exact'},
            {value:'updated',type:'4',mode:'exact'},
            {value:'E/e/update',type:'4',mode:'exact'},

            {value:".*/.*?increment\.jpeg$",type:'1',mode:'regex'},
            {value:".*/cover\.mp4$",type:'2',mode:'regex'},
            {value:".*/incrementCover\.c$",type:'3',mode:'regex'},
          ],
          except:[
            {value:'incrementCover/c/except',mode:'exact'},
            {value:'except\.zip$',mode:'regex'},
            {value:'H/h',mode:'exact'},
            {value:'H/h3',mode:'exact'},

          ],
          remove:[
            {value:'.*/.*?remove\.txt$',mode:'regex'},
            {value:'.*/remove$',mode:'regex'},
            {value:'H/h',mode:'exact'},
            //{value:'H/h2',mode:'exact'},
          ],
          mapping:[
            //{source:[{value:"E",mode:"exact"},{value:"E/E2",mode:"exact"},{value:"E1/.*",mode:"regex"}],target:'E2'},

            {value:"E",mode:"exact",target: "E2",mappingToChild:true},
            {value:"E",mode:"exact",target: "E3/EE",mappingToChild:false},
            {value:"E/E2",mode:"exact",target: "E2",mappingToChild:true},

            //{value:"E1/.*",mode:"regex",target: "E2",mappingToChild:true},
            {value:"(^E1\\/((?!\\/).)*$)",mode:"regex",target: "E2",mappingToChild:false},//第一层的映射
            {value:'H/h3',mode:'exact',target:'H/h2',mappingToChild: false}
            //{value:"E1",mode:"exact",target: "E2"},
          ]
        }
      },

    }
  },
/**
- except: 例外
` 优先级最高
- remove: 删除
` 优先级最高
- mapping :映射
` 优先级最高
- increment: 仅新增
` 优先级:1
- update: 更新
` 优先级:1
- incrementCover: 新增+覆盖
` 优先级:1
 - cover: 强覆盖
` 优先级:2
 */

  mounted() {
  //this.view.viewPortNodes=(this.view.boxHeight/this.view.treeItemHeight)+2;                //初始化可视节点数

    this.leftTree = buildTree(leftTrees, '');
    this.rightTree = buildTree(rightTrees, '');
    let leftDiffs={key:'left'};
    let rightDiffs={key:'right'};

    this.$nextTick(()=>{
      this.diff({
        node:{path:'/',children:this.leftTree,bsid:''},
        parentNode:null,
        parentRules:new Set(),
        rules:[RULE_CONF.add(),RULE_CONF.common(),...this.customRules.filter(r=>r.name!=='remove')],
        diffs:leftDiffs
      },{
        node:{path:'/',children:this.rightTree,bsid:''},
        parentNode:null,
        parentRules:new Set(),
        rules:[RULE_CONF.add(),RULE_CONF.common(),...this.customRules.filter(r=>r.name==='remove'||r.name==='path')],
        diffs:rightDiffs
      },true);
      this.diffs={left:leftDiffs,right:rightDiffs};


      let forest=this.mappingForest({children:this.diffs.left.mapping},{},(id,node,parentTarget)=>{
        let {path,bsid,type,name}=this.$refs.leftTree.getNode(id).data;
        let target;
        let inherit=false;

        if(!parentTarget&&node.value){
          target=[
              ...node.value.regex.map(n=>{
                let t=n.target;
                if(n.mappingToChild){
                  t=n.target.endsWith('/')?n.target + name : `${n.target}/${name}`;
                }
                return {target:t,source: path,mappingToChild:n.mappingToChild,mode:'regex'};
              }),
              ...node.value.exact.map(n=>{
                let t=n.target;
                if(n.mappingToChild){
                  t=n.target.endsWith('/')?n.target + name : `${n.target}/${name}`;
                }
                return {target:t,source: path,mappingToChild:n.mappingToChild,mode:'exact'};
            })
          ];
        }else if(parentTarget){
          inherit=true;
          target=parentTarget.map(n=>({source:path,target:path.replace(n.source,n.target),mode:n.mode,mappingToChild:n.mappingToChild}));
        }
        return {bsid,type,name,id,target,inherit,source:path,mappingFrom:"left",mappingTreeRoot:parentTarget?false:true};
      });
      let extendForest=this.extendTrees(forest);


      let midTreeMap={};
      this.mergeTree(this.leftTree,'left',midTreeMap, (node,pNode,pVal)=>{
          let exceptLeaf = treeLeaf(node.bsid, '.', this.diffs.left.except, 'children', 'value');
          if (exceptLeaf && exceptLeaf.type < 3) return;

          let leaf=treeLeaf(node.bsid,'.',this.diffs.left.mapping,'children','value');
          if(leaf&&pVal.children){//取父节点
            let idx=pVal.children.findIndex(i=>i.path===leaf.path);
            if(idx>=0)pVal.children.splice(idx,1);
          }
        });
      this.mergeTree(extendForest, 'mapping', midTreeMap);  //映射
      this.mergeTree(this.rightTree, 'right', midTreeMap);


      this.midTree=midTreeMap.children;

      console.log(this.diffs);
      console.log(midTreeMap);
      console.log(forest);
      console.log(extendForest);

    });
  },
  computed:{
    customRules(){
      let {increment,cover,except,remove,incrementCover,update,mapping}=this.ruleCompile;
      return [
        RULE_CONF.mapping('mapping',mapping,100),                                        //映射
        RULE_CONF.custom('except',except,101),                                                   //例外
        RULE_CONF.custom('remove',remove,102),                                                //删除
        RULE_CONF.custom('update',update,103),                                                 //更新
        RULE_CONF.custom('increment',increment,104),                                       //增量
        RULE_CONF.custom('incrementCover',incrementCover,105),                    //增量覆盖
        RULE_CONF.custom('cover',cover,106),                                                       //全量
        RULE_CONF.path(107),                                                                                                      //路径
      ];
    },
    ruleCompile(){
      let {match,except,remove,mapping}=this.conf.upload;
      return {
        increment:[
          ...buildRegexRule(match.filter(i=>i.mode==='regex'&&i.type==='1'&&i.value)),
          ...buildEqualRule(match.filter(i=>i.mode==='exact'&&i.type==='1'&&i.value))],
        cover:[
          ...buildRegexRule(match.filter(i=>i.mode==='regex'&&i.type==='2'&&i.value)),
          ...buildEqualRule(match.filter(i=>i.mode==='exact'&&i.type==='2'&&i.value))],
        incrementCover:[
          ...buildRegexRule(match.filter(i=>i.mode==='regex'&&i.type==='3'&&i.value)),
          ...buildEqualRule(match.filter(i=>i.mode==='exact'&&i.type==='3'&&i.value))],
        update:[
          ...buildRegexRule(match.filter(i=>i.mode==='regex'&&i.type==='4'&&i.value)),
          ...buildEqualRule(match.filter(i=>i.mode==='exact'&&i.type==='4'&&i.value))],
        except: [
          ...buildRegexRule(except.filter(i=>i.mode==='regex'&&i.value)),
          ...buildEqualRule(except.filter(i=>i.mode==='exact'&&i.value))],
        remove: [
          ...buildRegexRule(remove.filter(i=>i.mode==='regex'&&i.value)),
          ...buildEqualRule(remove.filter(i=>i.mode==='exact'&&i.value))],
        mapping:[
          ...buildRegexRule(mapping.filter(i=>i.mode==='regex'&&i.value),item=>item),
          ...buildEqualRule(mapping.filter(i=>i.mode==='exact'&&i.value),item=>item),
        ]
      };
    }
  },
  methods:{
    drawDiffStruct(leftNodes,midNodes,rightNodes,leftDiffs,rightDiffs,leftTreeRefs){
      let leftMap = list2map(leftNodes,'id');
      let rightMap = list2map(rightNodes,'id');

      let leaf=(bsid,map)=>treeLeaf(bsid,'.',map,'children','value')

      let canvasStruct=[],curStruct={};
      canvasStruct[0]=curStruct;
      let baseStack=[],baseTop,basePointer,baseLevel;
      let comparedStack=[],comparedTop,comparePointer,compareLevel;

      for(let node of midNodes){
        let midData=node.node.data;

        if(midData.left){
          let except=leaf(midData.left.bsid,leftDiffs.except);
          if(except){
            node.drawType='except';
            let leftExcept=leftMap[midData.left.id];


            let leftNode=leftTreeRefs.getNode(midData.left.id);
            let parent=elTreeParent(leftNode,node => leftMap[node.id]);
            if(leftExcept.level<compareLevel&&node.level<baseLevel&&comparePointer.drawType==='except'&&basePointer.drawType==='except'){

            }

          }



        }
      }


    },



    findBoxVisibleNode(treeBoxRefs,treeRef){                                                            //. 获得滚动窗口可视节点(暂时显示全部）
      let start=Math.floor(treeBoxRefs.scrollTop/this.treeItemHeight)-1;       //可视起始项坐标
      start=start<0?0:start;
      let origin=start*this.treeItemHeight-treeBoxRefs.scrollTop;                         //绘图起始点作为绘图坐标原点y （滚动节点一半情况）
      return $(treeBoxRefs)
          .find(".diff-node:visible")
          .toArray()
          //.splice(start,this.view.viewPortNodes)
          .map((n,idx)=>({
            e: n,                                                                   //起始y
            y: origin + this.treeItemHeight * idx,
            id: n.dataset.nodeId,
            node:treeRef.getNode(n.dataset.nodeId),
            level:parseInt(n.dataset.nodeLevel)
          }));
    },
    onMidFilterChange(type){
      this.$refs.midTree.filter(type);
    },
    //. 过滤节点
    filterMidTree(param,data,node){
      if(!param)return true;
      if(!node.parent.visible)return false;
      let leftExcept;
      let mappingExcept;
      let remove;

      if(data.left){
        let leaf=treeLeaf(data.left.bsid,'.',this.diffs.left.except,'children','value');
        leftExcept=leaf&&leaf.type<3;
      }
      if(data.mapping&&data.mapping.bsid){
        let leaf=treeLeaf(data.mapping.bsid,'.',this.diffs.left.except,'children','value');
        mappingExcept=leaf&&leaf.type<3;
      }
      if(data.right){
        let leaf=treeLeaf(data.right.bsid,'.',this.diffs.right.remove,'children','value');
        remove=leaf&&leaf.type<3;
      }

      if(remove){
        if(leftExcept||mappingExcept)return false;
        return true;
      }else{
        if(!data.right&&(leftExcept||mappingExcept))return false;
      }

      if(!data.left) {
        let pLeftNode = elTreeParent(node, (node) => node.data.left);
        if(pLeftNode){
          let leaf=treeLeaf(pLeftNode.data.left.bsid,'.',this.diffs.left.cover,'children','value');
          if(leaf&&leaf.type<3)return false;
        }
      }
      return true;
    },
    //.获取映射森林
    mappingForest(mapping,curTree,buildNodeData){
      let forest=[];
      if(!mapping.children)return forest;
      for(let entry of Object.entries(mapping.children)){
        let id=entry[0];
        let node=entry[1];
        if(node.value&&node.value.type===1){
          let newTree=buildNodeData(id,node);
          forest.push(newTree);
          if(node.children) {
            forest = forest.concat(this.mappingForest(node,newTree,buildNodeData));
          }
        }
        else{
          if(!curTree)curTree={};
          if (!curTree.children) curTree.children = [];
          let curNode=buildNodeData(id, node,curTree.target);
          curTree.children.push(curNode);
          if(node.children){
            forest = forest.concat(this.mappingForest(node,curNode,buildNodeData));
          }
        }
      }
      return forest;
    },
    //.扩展映射森林
    extendTrees(forest){
      let trees=[];
      for(let tree of forest){
        for(let targetItem of tree.target){
          let targets=targetItem.target.split('/');
          let extendTree={};
          let curNode=extendTree;
          for(let i=0;i<targets.length;i++){
            let target=targets[i];
            curNode.type=1;     //文件夹
            curNode.name=target;
            curNode.label=target;
            curNode.path=targets.slice(0,i+1).join('/');
            if(i<targets.length-1) {
              let subNode = {};
              curNode.children = [subNode];
              curNode = subNode;
            }
          }
          curNode.mappingTreeRoot=tree.mappingTreeRoot;
          curNode.type=tree.type;
          curNode.inherit=tree.inherit;
          curNode.source=tree.source;
          curNode.target=tree.target;
          curNode.children=tree.children;
          trees.push(extendTree);
          recursiveTree(extendTree,'children',(n,pn)=>{
            if(!n.path){
              n.path=`${pn.path}/${n.name}`;
            }
          },null);
        }
      }
      return trees;
    },

    //.合并树
    mergeTree(tree,from,map,onNode){
      for(let node of tree){
        recursiveTree(
            node,
            'children',
            ({path,bsid,type,label,name,display=true,id,mappingFrom,target,mappingTreeRoot},pNode,pVal)=>{
              if(pVal.children){
                let nodes=pVal.children.filter(i=>i.path===path);
                if(nodes.length>0){
                  nodes[0][from]={path,bsid,type,name,id};
                  if(mappingFrom)nodes[0][from].mappingFrom=mappingFrom;    //`
                  if(mappingFrom)nodes[0][from].mappingTreeRoot=mappingTreeRoot;    //`
                  if(target)nodes[0][from].target=target;                                             //`
                  return nodes[0];
                }
              }else{
                pVal.children=[];
              }
              //let child={from,path,bsid,type,label,name,display,[from]:{path,bsid,type,name,id}};
              let child={from,path,type,label,name,display,[from]:{path,bsid,type,name,id}};
              if(mappingFrom)child[from].mappingFrom=mappingFrom;               //`
              if(mappingTreeRoot)child[from].mappingTreeRoot=mappingTreeRoot;               //`
              if(target)child[from].target=target;                                                        //`
              pVal.children.push(child);
              if(onNode)onNode({path,bsid,type,label,name,display,id},pNode,pVal);
              return child;
            },
            null,
            map
        );
      }
    },
    /**
     *      t1                t2
     *      A                A
     *   /    \            /    \
     * A1    A2      A1    A2
     * reverse是否反转匹配遍历，避免相同树层遍历多次，
     * diff(t1)A->diff(t1)A1  diff(t1)A2   diff(t2)A1   diff(t1)A1
     * diff(t2)A->diff(t2)A1  diff(t1)A1  diff(t1)A1   diff(t1)A2
     * 指定reverse后，发现(t1)A和(t2)A的层级一致 就只遍历
     * diff(t1)A->diff(t1)A1  diff(t1)A2   diff(t2)A1   diff(t1)A1
     *
     */
    //.初始化规则匹配结构
    diff(pBase,pCompared,reverse){
      let baseMap = pBase.node?list2map(pBase.node.children,'path'):{};
      let comparedMap = pCompared.node?list2map(pCompared.node.children,'path'):{};
      let curBaseRules=new Set();
      let curComparedRules=new Set();
      this.buildDiff(baseMap,comparedMap,pBase,pCompared,curBaseRules,curComparedRules,false,reverse);
      if(reverse) {
        this.buildDiff(comparedMap, baseMap, pCompared, pBase, curComparedRules, curBaseRules, true,reverse);
      }
      return {base:curBaseRules,compared:curComparedRules};
    },
    buildDiff(baseMap,comparedMap,pBase,pCompared,curRuleBase,curRuleCompared,onlyBase=false,reverse) {
      for (let entry of Object.entries(baseMap)) {
        let path = entry[0];
        let base = entry[1];
        let compared = comparedMap[path];
        let subBaseRules = new Set(pBase.parentRules);
        let subComparedRules = new Set(pCompared.parentRules);
        //' 节点构建父节点传递子节点规则
        for (let rule of pBase.parentRules) {
          rule.compile(base, compared, pBase.node, pCompared.node).buildChild(pBase.diffs);
        }
        //' 节点构建自身匹配规则
        for (let ruleBuilder of pBase.rules) {
          let rule = ruleBuilder.compile(base, compared, pBase.node, pCompared.node);
          if (!rule.match) continue;
          rule.build(pBase.diffs);
          if (rule.child) {
            subBaseRules.add(ruleBuilder);
          }
          if (rule.parent) {
            curRuleBase.add(ruleBuilder);
          }
        }
        //' 遍历所有新增，共同节点
        let subBase = {...pBase, node: base, parentNode: pBase.node, parentRules: subBaseRules};
        let subCompared = {...pCompared, node: compared, parentNode: pCompared.node, parentRules: subComparedRules};
        let matchSubRules = this.diff(subBase, subCompared,compared?false:reverse);
        matchSubRules.base.forEach(s => {
          s.compile(base, compared, pBase.node, pCompared.node).buildParent(pBase.diffs);
          curRuleBase.add(s);
        });
        if(!onlyBase||(!compared)) {
          matchSubRules.compared.forEach(s => {
            s.compile(base, compared, pBase.node, pCompared.node).buildParent(pCompared.diffs);
            curRuleCompared.add(s);
          });
        }
      }
    },


  }
}
</script>

<style scoped>

</style>