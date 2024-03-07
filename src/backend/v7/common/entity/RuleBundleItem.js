import {Rule} from "@/backend/v7/common/entity/Rule";
import {Node} from "@/backend/v7/common/entity/Node";

class RuleBundleItem {
    rule=new Rule();        //,规则
    source=new Node();  //,源节点
    target=new Node();  //,目标节点

    constructor(rule=new Rule(),source=new Node(),target=new Node()){
        this.rule=rule;
        this.source=source;
        this.target=target;
    }
}

export {RuleBundleItem}