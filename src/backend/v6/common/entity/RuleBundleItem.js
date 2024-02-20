import {NodeBundle} from "@/backend/v5/common/entity/NodeBundle";
import {Rule} from "@/backend/v6/common/entity/Rule";
import {Node} from "@/backend/v6/common/entity/Node";

class RuleBundleItem {
    source;                 //, 源节点
    target;                  //, 映射节点
    match;                  //, 匹配规则节点（继承时）- 保留
    root;                     //, 源树根节点 - 保留
    merge;                  //, 合并前节点 - 保留

    rule;                                                                              //, 规则配置
    generation=0;                                                              //, 继承代数

    constructor(rule=new Rule(),generation=0) {
        this.rule=rule;
        this.generation=generation;
    }

    //. 校验规则
    test(node=new Node()){
        return this.rule.test(node);
    }

    //.构建匹配
    copyAsMatch(source=new Node(),target=new Node()){
        let nb=new RuleBundleItem(this.rule,0);
        nb.source=source;
        nb.target=target;
        nb.match=source;
        return nb;
    }

    //. 构建继承
    copyAsInherit(source=new Node(),target=new Node()){
        let nb=new RuleBundleItem(this.rule,this.generation+1);
        nb.match=this.match;
        nb.source=source;
        nb.target=target;
        return nb;
    }


}

export {RuleBundleItem}