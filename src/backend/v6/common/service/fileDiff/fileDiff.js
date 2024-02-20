import {RuleBundle} from "@/backend/v6/common/entity/RuleBundle";
import {Node} from "@/backend/v6/common/entity/Node";

function trees(pb,rules=new RuleBundle(),processor,parentNode){
    let children=processor.children(pb);
    if(!children||children.length===0)return;
    for(let base of children) {
        let baseNode = new Node().from(base);
        let matchRuleList=rules.check(baseNode);
        let inheritRuleList=parentNode?parentNode.rules.inherits(baseNode):[];
        baseNode.relates=processor.buildRelates(baseNode,matchRuleList,inheritRuleList);
        baseNode.rules=new RuleBundle()
            .append(matchRuleList)
            .append(inheritRuleList)
            .sorts();
        trees(base,rules,processor,baseNode);
    }
}