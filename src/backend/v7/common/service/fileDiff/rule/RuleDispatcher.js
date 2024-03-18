import {DISPATCH_CONFIG} from "@/backend/v7/common/config/configCenter";
import {Node} from "@/backend/v7/common/entity/Node";
import {relativePath,rootName} from "@/backend/v7/common/util/util";
import {formatPath} from "@/backend/v5/common/util/util";
import {FILE_TYPE} from "@/backend/v5/common/constant/Constant";
import {RuleBundleItem} from "@/backend/v7/common/entity/RuleBundleItem";
import {ACTION} from "@/backend/v7/common/service/fileDiff/rule/processor/BaseProcessor";
import {ITERATE_MODE, TreeIterator} from "@/backend/v7/common/service/tree/iterator/TreeIterator";
import {FileDiffIterateProcessor} from "@/backend/v7/common/service/tree/iterator/processor/FileDiffIterateProcessor";

/**
 %  baseTree:              主树
 `            |     规则(increment,cover,update,incrementUpdate)
 `           v
 %  mergeTree:         合并结果树
 `         ^
 `         |    规则(remove)
 %  targetTree:         目标树

 %  tree: 合并结果树/合并前目标树 根据Node.seq(版本) Node.origin(是否源节点)过滤显示
 %  seq: 当前版本
 %  key: 规则分组 主树遍历规则时用base, 目标树遍历规则时用target
 % iteratorProcessor： 遍历节点处理器
 % searchIterator:         查询迭代器
 % addIterator:             添加节点迭代器
 */
class RuleDispatcher{

    tree;
    seq;
    key;
    iteratorProcessor;
    treeIterator=new TreeIterator();

    constructor(tree=new Node(),key,seq=new Date().getTime()) {
        this.tree=tree;
        this.seq=seq;
        this.key=key;
        this.iteratorProcessor=new FileDiffIterateProcessor(this.seq);
        this.treeIterator=new TreeIterator(this.tree,this.iteratorProcessor);
    }


    dispatch(baseNode=new Node(),checkRules=[],inheritRules=[]){
        checkRules.map(rule=>{
            this.execute(baseNode,rule,false);
        });
        inheritRules.map(rule=>{
            this.execute(baseNode,rule,true);
        });
    }


    //.处理规则
    execute(baseNode=new Node(),rule=new RuleBundleItem(),inherit=false){
        let ruleProcessor=new DISPATCH_CONFIG[rule.config]();
        //, 规则处理器
        let rbi=ruleProcessor.process(baseNode,rule,inherit);
        //, 映射路径查找trees
        let {relative,leaf,match,parent}=this.treeIterator.execute(ITERATE_MODE.SEARCH,rbi.rule.mapping(baseNode));
        //, 构建映射目标节点
        let buildRes=ruleProcessor.buildTarget(baseNode,rbi,false,leaf);


        switch (buildRes.action) {
            case ACTION.ADD:            return this.onAddNode(relative,leaf);
            case ACTION.REMOVE:     return this.onRemoveNode(findResult);
        }


        if(buildRes.action===ACTION.ADD){
            //, 父节点可视再新增节点
            if(!match){
                this.treeIterator.execute(ITERATE_MODE.ADD,relative);
                //this.treeIterator.execute(relative,buildRes.node,rule.zip,inherit);
            }

        }else if(buildRes.action===ACTION.REMOVE){
            if(match){
                if(){

                }
            }
        }

    }




    onAddNode(relative){
        this.treeIterator.execute(ITERATE_MODE.ADD,relative);
    }

    onRemoveNode(){
        this.treeIterator.execute(ITERATE_MODE.SEARCH,)
    }




    //. 设置父节点版本 用于新增子节点的版本和父节点不同时
    setParentVersion(node=new Node(),rbi=new RuleBundleItem()){
        let {parent}=node;
        if(!parent)return;



        if(parent.seq!==this.seq){
            if(parent.origin){//,源节点

            }


            let rbi=node.parent.rb.cur(this.key);


            node.parent.rb.clear();
            node.parent.rb.append(rbi,this.key);
        }else{

        }


    }



    /**
     * .根据路径添加节点
     * .@param path                          相对路径
     * .@param leaf                            当前叶子节点
     * .@param zip                             是否映射为zip
     * .@param origin                        是否源节点
     */
    appendNode(path,leaf=new Node(),zip=false,origin=false){
        let root=rootName(path);
        if(root===path){
            let child=new Node(formatPath(leaf.path,path),zip?FILE_TYPE.ZIP:FILE_TYPE.FILE,leaf.type===FILE_TYPE.ZIP||leaf.inZip,origin,true,this.seq);
            leaf.children.push(child);
            return child;
        }else{
            let child=new Node(formatPath(leaf.path,root),FILE_TYPE.DIRECTORY,leaf.type===FILE_TYPE.ZIP||leaf.inZip,origin,true,this.seq);
            leaf.children.push(child);
            return this.appendNode(relativePath(leaf.path),child,zip);
        }
    }


    findNearestNode(path='',parent=new Node()){
        parent=!parent?this.tree:parent;
        let rootDir=rootName(path);
        let childNode;

        let idx=0;
        for(let n of parent.children.slice()){
            if(n.name===rootDir){               //, 查找到对应节点
                childNode=n;
                break;
            }
            if(!n.origin&&n.seq!==this.seq){                   //, 遍历过程发现非本此版本的顺便删除
                parent.children.splice(idx,1);
            }else {
                idx++;
            }
        }

        if(childNode&&childNode.children&&childNode.children.length>0){
            return this.findNearestNode(relativePath(path),childNode);
        }else{
            return {
                relative:path,
                leaf:childNode||parent,
                match:childNode!==undefined&&childNode!=null,
                parent:parent
            }
        }
    }

}

export {RuleDispatcher}