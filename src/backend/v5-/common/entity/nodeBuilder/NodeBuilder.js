import {RuleBundle} from "@/backend/v5/common/entity/RuleBundle";
import {Node} from "@/backend/v5/common/entity/Node";
import * as Util from "@/backend/v5/common/util/Util";

class NodeBuilder {

    buildRelates(baseNode=new Node(),matchRules=new RuleBundle(),inheritRules=new RuleBundle()){
        let matchRuleList=matchRules.get()||[];
        let inheritRuleList=inheritRules.get()||[];
        let map={};
        matchRuleList.map(nr=>{
            let targetPath=nr.rule.mapping(nr.nodes.source);
            nr.nodes.target=new Node(Util.baseName(targetPath),targetPath,)
            if(map[nr.nodes.source.path])return;
            map[nr.nodes.source.path]=nr.nodes.source;
        });
        inheritRuleList.map(nr=>{
            if(map[nr.nodes.source.path])return;
            map[nr.nodes.source.path]=nr.nodes.source;
        });
        return Object.values(map);
    }

}

export {NodeBuilder};