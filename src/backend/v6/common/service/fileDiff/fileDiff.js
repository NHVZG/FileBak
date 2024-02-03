import {RuleBundle} from "@/backend/v6/common/entity/RuleBundle";
import {Node} from "@/backend/v6/common/entity/Node";

function trees(pb,rules=new RuleBundle(),processor,parentNode){
    let children=processor.children(pb);
    if(!children||children.length===0)return;
    for(let base of children) {
        let baseNode = new Node().from(base);
        let matchRules=rules.check(baseNode);
        let inheritRules=parentNode?parentNode.rules.inherits(baseNode):new RuleBundle();
        baseNode.relates=processor.buildRelates(baseNode,matchRules,inheritRules);
        baseNode.rules=new RuleBundle()
            .append(matchRules)
            .append(inheritRules)
            .sorts();
        trees(base,rules,processor,baseNode);
    }
}