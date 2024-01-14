import {Node} from "@/backend/v5/common/entity/Node";
import {NodeBundle} from "@/backend/v5/common/entity/NodeBundle";

class NodeRule{
    rule;                                                                              //, 规则配置
    nodes=new NodeBundle();                    //, 节点集合
    generation=0;                                                               //, 继承代数

    constructor(rule,nodes=new NodeBundle(),generation=0) {
        this.rule=rule;
        this.nodes=nodes;
        this.generation=generation;
    }

    //. 校验规则
    test(node){
        return this.rule.test(node);
    }

    //.构建匹配
    copyAsMatch(source=new Node(),target=new Node()){
        let nb=new NodeBundle(source,target,source);
        return new NodeRule(this.rule,nb,0);
    }

    //.构建继承
    copyAsInherit(source=new Node(),target=new Node()){
        let nb=new NodeBundle(source,target,this.nodes.match);
        return new NodeRule(this.rule,nb,this.generation+1);
    }

}

export {NodeRule}