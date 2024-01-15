import {RuleBundle} from "@/backend/v5/common/entity/RuleBundle";

class NodeBuilder {

    buildRelates(matchRules=new RuleBundle(),inheritRules=new RuleBundle()){
        let matchRuleList=matchRules.get()||[];
        let inheritRuleList=inheritRules.get()||[];
        let map={};
        matchRuleList.map(nr=>{
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