import {DISPATCH_CONFIG} from "@/backend/v7/common/config/configCenter";
import {Node} from "@/backend/v7/common/entity/Node";
import {relativePath,rootName} from "@/backend/v7/common/util/util";
import {formatPath} from "@/backend/v5/common/util/util";
import {FILE_TYPE} from "@/backend/v5/common/constant/Constant";
import {RuleBundleItem} from "@/backend/v7/common/entity/RuleBundleItem";
import {ACTION} from "@/backend/v7/common/service/fileDiff/rule/processor/BaseProcessor";
import {ITERATE_MODE, TreeIterator} from "@/backend/v7/common/service/tree/iterator/TreeIterator";
import {FileDiffIterateProcessor} from "@/backend/v7/common/service/tree/iterator/processor/FileDiffIterateProcessor";
import {FileDiffRemoveIterateProcessor} from "@/backend/v7/common/service/tree/iterator/processor/FileDiffRemoveIterateProcessor";

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
 % removeProcessor： 删除节点处理器
 % treeIterator：          树结构迭代器
 */
class RuleDispatcher{

    tree;
    seq;
    key;
    iteratorProcessor=new FileDiffIterateProcessor();
    removeProcessor=new FileDiffRemoveIterateProcessor();
    treeIterator=new TreeIterator();

    constructor(tree=new Node(),key,seq=new Date().getTime()) {
        this.tree=tree;
        this.seq=seq;
        this.key=key;
        this.iteratorProcessor=new FileDiffIterateProcessor(this.seq);
        this.removeProcessor=new FileDiffRemoveIterateProcessor(this.seq);
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
        let buildRes=ruleProcessor.buildTarget(baseNode,rbi,inherit,leaf);


        switch (buildRes.action) {
            case ACTION.ADD:            return this.onAddNode({path:relative,fileType:rule.zip,origin:false,seq:this.seq});
            case ACTION.REMOVE:     return this.onRemoveNode(parent,{path:relative});
            case ACTION.UPDATE:      return
        }

    }




    onAddNode(arg){
        return this.treeIterator.execute(ITERATE_MODE.ADD,{...arg,processor:this.iteratorProcessor});
    }

    onRemoveNode(parent,arg){
        return new TreeIterator(parent,this.removeProcessor).execute(ITERATE_MODE.SEARCH,{...arg,processor:this.removeProcessor});
    }



}

export {RuleDispatcher}