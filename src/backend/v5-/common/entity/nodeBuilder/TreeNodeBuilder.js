import {NodeBuilder} from "@/backend/v5/common/entity/nodeBuilder/NodeBuilder";
import {buildPathNode} from "@/backend/v5/common/util/Util";
import {RuleBundle} from "@/backend/v5/common/entity/RuleBundle";
import {Node} from "@/backend/v5/common/entity/Node";

class TreeNodeBuilder extends NodeBuilder{
    tree=new Node();

    constructor(tree=new Node()) {
        super();
        this.tree=tree;
    }


    buildRelates(baseNode=new Node(),matchRules = new RuleBundle(), inheritRules = new RuleBundle()) {
        let matchRuleList=matchRules.get()||[];
        let mappingNodeRule=matchRuleList.filter(nr=>nr.rule.config.base!==nr.rule.config.target);
        mappingNodeRule

    }
}

export {TreeNodeBuilder};